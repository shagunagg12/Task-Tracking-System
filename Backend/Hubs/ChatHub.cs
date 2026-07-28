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
        // In a production app, use Redis or a database to track connections,
        // but an in-memory dictionary works for a single instance.
        private static readonly ConcurrentDictionary<string, string> UserConnections = new();

        public ChatHub(ApplicationDbContext context)
        {
            _context = context;
        }

        public override Task OnConnectedAsync()
        {
            var userId = Context.GetHttpContext()?.Request.Query["userId"].ToString();
            if (!string.IsNullOrEmpty(userId))
            {
                UserConnections[userId] = Context.ConnectionId;
            }
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            var item = UserConnections.FirstOrDefault(x => x.Value == Context.ConnectionId);
            if (item.Key != null)
            {
                UserConnections.TryRemove(item.Key, out _);
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

            // Send back to the sender so their UI updates immediately with DB info
            await Clients.Caller.SendAsync("ReceiveMessage", message);

            // If the receiver is online, push to them
            if (UserConnections.TryGetValue(receiverId.ToString(), out var receiverConnectionId))
            {
                await Clients.Client(receiverConnectionId).SendAsync("ReceiveMessage", message);
            }
        }
    }
}
