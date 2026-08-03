using Backend.Data;
using Backend.Hubs;
using Backend.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class MessagesService : IMessagesService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly Cloudinary _cloudinary;

        public MessagesService(ApplicationDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;

            var cloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");
            var apiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");
            var apiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");
            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(account);
        }

        public async Task<object> GetChatHistoryAsync(int currentUserId, int otherUserId)
        {
            var messages = await _context.Messages.AsNoTracking()
                .Where(m => (m.SenderId == currentUserId && m.ReceiverId == otherUserId) ||
                            (m.SenderId == otherUserId && m.ReceiverId == currentUserId))
                .OrderBy(m => m.Timestamp)
                .ToListAsync();

            var result = messages.Select(m => new {
                id = m.Id,
                senderId = m.SenderId,
                receiverId = m.ReceiverId,
                content = m.Content,
                timestamp = m.Timestamp,
                fileUrl = m.FileUrl,
                fileType = m.FileType,
                replyToMessageId = m.ReplyToMessageId
            });

            return result;
        }

        public async Task MarkMessagesAsReadAsync(int currentUserId, int senderId)
        {
            var unreadMessages = await _context.Messages
                .Where(m => m.SenderId == senderId && m.ReceiverId == currentUserId && !m.IsRead)
                .ToListAsync();

            if (unreadMessages.Any())
            {
                foreach (var msg in unreadMessages)
                {
                    msg.IsRead = true;
                }
                await _context.SaveChangesAsync();
            }
        }

        public async Task<object> GetProjectChatHistoryAsync(int currentUserId, int projectId)
        {
            var messages = await _context.ProjectMessages.AsNoTracking()
                .Include(m => m.Sender)
                .Where(m => m.ProjectId == projectId)
                .OrderBy(m => m.Timestamp)
                .ToListAsync();

            var result = messages.Select(m => new {
                id = m.Id,
                projectId = m.ProjectId,
                senderId = m.SenderId,
                senderName = m.Sender?.FullName ?? m.Sender?.Email ?? "Unknown",
                content = m.Content,
                timestamp = m.Timestamp,
                fileUrl = m.FileUrl,
                fileType = m.FileType,
                replyToMessageId = m.ReplyToMessageId
            });

            return result;
        }

        private string? GetPublicIdFromUrl(string url, string fileType)
        {
            if (string.IsNullOrEmpty(url)) return null;
            try {
                var uri = new Uri(url);
                var segments = uri.Segments;
                int uploadIndex = Array.IndexOf(segments, "upload/");
                if (uploadIndex == -1) return null;
                
                string publicIdWithExt = string.Join("", segments.Skip(uploadIndex + 2));
                if (fileType == "raw") return Uri.UnescapeDataString(publicIdWithExt);
                
                int lastDot = publicIdWithExt.LastIndexOf('.');
                if (lastDot != -1) {
                    return Uri.UnescapeDataString(publicIdWithExt.Substring(0, lastDot));
                }
                return Uri.UnescapeDataString(publicIdWithExt);
            } catch {
                return null;
            }
        }

        public async Task DeleteMessageAsync(int currentUserId, int id)
        {
            var message = await _context.Messages.FindAsync(id);
            if (message == null) throw new KeyNotFoundException("Message not found");
            if (message.SenderId != currentUserId) throw new UnauthorizedAccessException("Can only delete own messages");

            if (!string.IsNullOrEmpty(message.FileUrl) && !string.IsNullOrEmpty(message.FileType))
            {
                var publicId = GetPublicIdFromUrl(message.FileUrl, message.FileType);
                if (publicId != null)
                {
                    var resourceType = message.FileType == "raw" ? ResourceType.Raw : (message.FileType == "image" ? ResourceType.Image : ResourceType.Video);
                    var destroyParams = new DeletionParams(publicId) { ResourceType = resourceType };
                    await _cloudinary.DestroyAsync(destroyParams);
                }
            }

            _context.Messages.Remove(message);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("MessageDeleted", id);
        }

        public async Task DeleteProjectMessageAsync(int currentUserId, int id)
        {
            var message = await _context.ProjectMessages.FindAsync(id);
            if (message == null) throw new KeyNotFoundException("Message not found");
            if (message.SenderId != currentUserId) throw new UnauthorizedAccessException("Can only delete own messages");

            if (!string.IsNullOrEmpty(message.FileUrl) && !string.IsNullOrEmpty(message.FileType))
            {
                var publicId = GetPublicIdFromUrl(message.FileUrl, message.FileType);
                if (publicId != null)
                {
                    var resourceType = message.FileType == "raw" ? ResourceType.Raw : (message.FileType == "image" ? ResourceType.Image : ResourceType.Video);
                    var destroyParams = new DeletionParams(publicId) { ResourceType = resourceType };
                    await _cloudinary.DestroyAsync(destroyParams);
                }
            }

            _context.ProjectMessages.Remove(message);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.Group($"project-{message.ProjectId}").SendAsync("ProjectMessageDeleted", id);
        }
    }
}
