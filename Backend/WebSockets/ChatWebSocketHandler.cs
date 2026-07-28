using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.WebSockets
{
    public class ChatWebSocketHandler
    {
        private readonly WebSocketManager _webSocketManager;
        private readonly IServiceScopeFactory _scopeFactory;

        public ChatWebSocketHandler(WebSocketManager webSocketManager, IServiceScopeFactory scopeFactory)
        {
            _webSocketManager = webSocketManager;
            _scopeFactory = scopeFactory;
        }

        public async Task HandleAsync(HttpContext context, WebSocket webSocket)
        {
            var userId = context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                await webSocket.CloseAsync(WebSocketCloseStatus.PolicyViolation, "Unauthorized", CancellationToken.None);
                return;
            }

            var connectionId = _webSocketManager.AddSocket(webSocket, userId);
            
            var buffer = new byte[1024 * 4];
            WebSocketReceiveResult result;

            try
            {
                while (webSocket.State == WebSocketState.Open)
                {
                    result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        var msgString = Encoding.UTF8.GetString(buffer, 0, result.Count);
                        var message = JsonSerializer.Deserialize<ClientMessage>(msgString, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                        
                        if (message != null)
                        {
                            if (message.Type == "JoinChat")
                            {
                                _webSocketManager.AddToGroup(connectionId, message.ChatId);
                            }
                            else if (message.Type == "LeaveChat")
                            {
                                _webSocketManager.RemoveFromGroup(connectionId, message.ChatId);
                            }
                            else if (message.Type == "SendMessage")
                            {
                                await ProcessSendMessage(userId, message.ChatId, message.Text);
                            }
                        }
                    }
                    else if (result.MessageType == WebSocketMessageType.Close)
                    {
                        await _webSocketManager.RemoveSocket(connectionId, userId);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"WebSocket Error: {ex.Message}");
                await _webSocketManager.RemoveSocket(connectionId, userId);
            }
        }

        private async Task ProcessSendMessage(string senderIdStr, string chatIdStr, string text)
        {
            if (!int.TryParse(senderIdStr, out var senderId) || !int.TryParse(chatIdStr, out var sessionId))
                return;

            using var scope = _scopeFactory.CreateScope();
            var _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var isMember = await _context.ChatSessionMembers
                .AnyAsync(c => c.ChatSessionId == sessionId && c.UserId == senderId);

            if (!isMember) return;

            var message = new ChatMessage
            {
                ChatSessionId = sessionId,
                SenderId = senderId,
                Text = text,
                CreatedAt = DateTime.UtcNow
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            var senderName = await _context.Users
                .Where(u => u.Id == senderId)
                .Select(u => u.FullName)
                .FirstOrDefaultAsync();

            var payload = new
            {
                id = message.Id,
                chatSessionId = message.ChatSessionId,
                senderId = message.SenderId,
                senderName = senderName,
                text = message.Text,
                createdAt = message.CreatedAt
            };

            var sessionMembers = await _context.ChatSessionMembers
                .Where(m => m.ChatSessionId == sessionId)
                .Select(m => m.UserId.ToString())
                .ToListAsync();

            // Broadcast to the group specifically
            await _webSocketManager.BroadcastToGroupAsync(chatIdStr, payload);
            
            // Also explicitly broadcast to users
            await _webSocketManager.BroadcastToUsersAsync(sessionMembers, payload);
        }
    }

    public class ClientMessage
    {
        public string Type { get; set; }
        public string ChatId { get; set; }
        public string Text { get; set; }
    }
}
