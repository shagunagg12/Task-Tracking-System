using Microsoft.AspNetCore.SignalR;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;

namespace Backend.Hubs
{
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;
        
        // Track connection ID -> User ID
        private static readonly ConcurrentDictionary<string, string> ConnectionToUser = new();
        // Track User ID -> Set of connection IDs (for multiple tabs)
        private static readonly ConcurrentDictionary<string, HashSet<string>> UserConnections = new();

        public ChatHub(ApplicationDbContext context)
        {
            _context = context;
        }

        public override Task OnConnectedAsync()
        {
            var userId = Context.GetHttpContext()?.Request.Query["userId"].ToString();
            if (!string.IsNullOrEmpty(userId))
            {
                ConnectionToUser[Context.ConnectionId] = userId;
                var connections = UserConnections.GetOrAdd(userId, _ => new HashSet<string>());
                bool isNewOnline = false;
                lock(connections) 
                {
                    isNewOnline = connections.Count == 0;
                    connections.Add(Context.ConnectionId);
                }
                
                if (isNewOnline)
                {
                    Clients.All.SendAsync("UserOnline", userId);
                }
            }
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            if (ConnectionToUser.TryRemove(Context.ConnectionId, out var userId))
            {
                if (UserConnections.TryGetValue(userId, out var connections))
                {
                    bool isNowOffline = false;
                    lock(connections) 
                    {
                        connections.Remove(Context.ConnectionId);
                        isNowOffline = connections.Count == 0;
                    }
                    
                    if (isNowOffline)
                    {
                        Clients.All.SendAsync("UserOffline", userId);
                    }
                }
            }
            return base.OnDisconnectedAsync(exception);
        }

        public async Task<object> SendMessage(int senderId, int receiverId, string content, string? fileUrl = null, string? fileType = null, int? replyToMessageId = null)
        {
            var message = new Message
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Content = string.IsNullOrEmpty(content) ? (fileType == "audio" ? "[Voice Message]" : "[Attachment]") : content,
                Timestamp = DateTime.UtcNow,
                FileUrl = fileUrl,
                FileType = fileType,
                ReplyToMessageId = replyToMessageId
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Create a DTO to prevent EF proxy serialization cycles
            var messageDto = new {
                id = message.Id,
                senderId = message.SenderId,
                receiverId = message.ReceiverId,
                content = message.Content,
                timestamp = message.Timestamp,
                fileUrl = message.FileUrl,
                fileType = message.FileType,
                replyToMessageId = message.ReplyToMessageId
            };

            // Send back to the sender (all their tabs)
            if (UserConnections.TryGetValue(senderId.ToString(), out var senderConnections))
            {
                List<string> conns;
                lock(senderConnections)
                {
                    conns = senderConnections.ToList();
                }
                foreach(var conn in conns)
                {
                    await Clients.Client(conn).SendAsync("ReceiveMessage", messageDto);
                }
            }

            // Push to receiver (all their tabs)
            if (UserConnections.TryGetValue(receiverId.ToString(), out var receiverConnections))
            {
                List<string> conns;
                lock(receiverConnections) 
                {
                    conns = receiverConnections.ToList();
                }
                foreach(var conn in conns) 
                {
                    await Clients.Client(conn).SendAsync("ReceiveMessage", messageDto);
                }
            }

            return messageDto;
        }
        
        // Broadcast typing status
        public async Task SendTyping(int senderId, int receiverId)
        {
            if (UserConnections.TryGetValue(receiverId.ToString(), out var receiverConnections))
            {
                List<string> conns;
                lock(receiverConnections) 
                {
                    conns = receiverConnections.ToList();
                }
                foreach(var conn in conns) 
                {
                    await Clients.Client(conn).SendAsync("UserTyping", senderId);
                }
            }
        }

        // --- Project Group Chat Methods ---

        public async Task JoinProjectGroup(int projectId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"project-{projectId}");
        }

        public async Task LeaveProjectGroup(int projectId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"project-{projectId}");
        }

        public async Task<object> SendProjectMessage(int projectId, int senderId, string content, string? fileUrl = null, string? fileType = null, int? replyToMessageId = null)
        {
            var message = new ProjectMessage
            {
                ProjectId = projectId,
                SenderId = senderId,
                Content = string.IsNullOrEmpty(content) ? (fileType == "audio" ? "[Voice Message]" : "[Attachment]") : content,
                Timestamp = DateTime.UtcNow,
                FileUrl = fileUrl,
                FileType = fileType,
                ReplyToMessageId = replyToMessageId
            };

            _context.ProjectMessages.Add(message);
            await _context.SaveChangesAsync();

            var senderUser = await _context.Users.FindAsync(senderId);

            var messageDto = new {
                id = message.Id,
                projectId = message.ProjectId,
                senderId = message.SenderId,
                senderName = senderUser?.FullName ?? senderUser?.Email ?? "Unknown",
                content = message.Content,
                timestamp = message.Timestamp,
                fileUrl = message.FileUrl,
                fileType = message.FileType,
                replyToMessageId = message.ReplyToMessageId
            };

            // Broadcast to everyone in the project group
            await Clients.Group($"project-{projectId}").SendAsync("ReceiveProjectMessage", messageDto);

            return messageDto;
        }
        
        // Fetch all online users
        public List<string> GetOnlineUsers()
        {
            var onlineUsers = new List<string>();
            foreach (var kvp in UserConnections)
            {
                lock(kvp.Value)
                {
                    if (kvp.Value.Count > 0)
                    {
                        onlineUsers.Add(kvp.Key);
                    }
                }
            }
            return onlineUsers;
        }
    }
}
