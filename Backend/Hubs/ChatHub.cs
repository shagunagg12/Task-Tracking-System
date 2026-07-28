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
                lock(connections) 
                {
                    connections.Add(Context.ConnectionId);
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
                    lock(connections) 
                    {
                        connections.Remove(Context.ConnectionId);
                    }
                }
            }
            return base.OnDisconnectedAsync(exception);
        }

        public async Task SendMessage(int senderId, int receiverId, string content)
        {
            var message = new Message
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Content = content,
                Timestamp = DateTime.UtcNow
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Send back to the sender (all their tabs)
            if (UserConnections.TryGetValue(senderId.ToString(), out var senderConnections))
            {
                lock(senderConnections)
                {
                    foreach(var conn in senderConnections)
                    {
                        Clients.Client(conn).SendAsync("ReceiveMessage", message);
                    }
                }
            }

            // Push to receiver (all their tabs)
            if (UserConnections.TryGetValue(receiverId.ToString(), out var receiverConnections))
            {
                lock(receiverConnections) 
                {
                    foreach(var conn in receiverConnections) 
                    {
                        Clients.Client(conn).SendAsync("ReceiveMessage", message);
                    }
                }
            }
        }
        
        // Broadcast typing status
        public async Task SendTyping(int senderId, int receiverId)
        {
            if (UserConnections.TryGetValue(receiverId.ToString(), out var receiverConnections))
            {
                lock(receiverConnections) 
                {
                    foreach(var conn in receiverConnections) 
                    {
                        Clients.Client(conn).SendAsync("UserTyping", senderId);
                    }
                }
            }
        }
    }
}
