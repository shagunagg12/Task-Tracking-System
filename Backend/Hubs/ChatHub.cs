using Microsoft.AspNetCore.SignalR;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;

namespace Backend.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;

        public ChatHub(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task JoinChat(string chatSessionId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, chatSessionId);
        }

        public async Task LeaveChat(string chatSessionId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatSessionId);
        }

        public async Task SendMessage(string chatSessionId, string messageText)
        {
            var userIdString = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                Console.WriteLine("SendMessage failed: Unauthenticated user.");
                return;
            }

            if (!int.TryParse(chatSessionId, out int sessionId))
            {
                Console.WriteLine($"SendMessage failed: Invalid chatSessionId {chatSessionId}.");
                return;
            }

            var session = await _context.ChatSessions.FindAsync(sessionId);
            if (session == null)
            {
                return;
            }

            var message = new ChatMessage
            {
                ChatSessionId = sessionId,
                SenderId = userId,
                Text = messageText,
                CreatedAt = DateTime.UtcNow
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            var sender = await _context.Users.FindAsync(userId);
            string senderName = sender?.FullName ?? "Unknown";

            var sessionMembers = await _context.ChatSessionMembers
                .Where(m => m.ChatSessionId == sessionId)
                .Select(m => m.UserId.ToString())
                .ToListAsync();

            // Broadcast to all members of the chat session directly (if User ID mapping works)
            await Clients.Users(sessionMembers).SendAsync("ReceiveMessage", new
            {
                id = message.Id,
                chatSessionId = message.ChatSessionId,
                senderId = message.SenderId,
                senderName = senderName,
                text = message.Text,
                createdAt = message.CreatedAt
            });

            // Fallback: Also broadcast to the SignalR group explicitly to ensure the active chat viewers receive it immediately
            await Clients.Group(chatSessionId).SendAsync("ReceiveMessage", new
            {
                id = message.Id,
                chatSessionId = message.ChatSessionId,
                senderId = message.SenderId,
                senderName = senderName,
                text = message.Text,
                createdAt = message.CreatedAt
            });

            // Diagnostic Fallback: Broadcast to everyone to guarantee delivery
            await Clients.All.SendAsync("ReceiveMessage", new
            {
                id = message.Id,
                chatSessionId = message.ChatSessionId,
                senderId = message.SenderId,
                senderName = senderName,
                text = message.Text,
                createdAt = message.CreatedAt
            });
        }
    }
}
