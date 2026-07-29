using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Backend.Hubs;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly Cloudinary _cloudinary;

        public MessagesController(ApplicationDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;

            var cloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");
            var apiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");
            var apiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");
            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(account);
        }

        // GET: api/Messages/history/{otherUserId}
        [HttpGet("history/{otherUserId}")]
        public async Task<ActionResult<IEnumerable<Message>>> GetChatHistory(int otherUserId)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int currentUserId))
            {
                return Unauthorized();
            }

            var messages = await _context.Messages
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

            return Ok(result);
        }

        // PUT: api/Messages/mark-read/{senderId}
        [HttpPut("mark-read/{senderId}")]
        public async Task<IActionResult> MarkMessagesAsRead(int senderId)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int currentUserId))
            {
                return Unauthorized();
            }

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

            return Ok();
        }

        // GET: api/Messages/project-history/{projectId}
        [HttpGet("project-history/{projectId}")]
        public async Task<ActionResult<IEnumerable<ProjectMessage>>> GetProjectChatHistory(int projectId)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int currentUserId))
            {
                return Unauthorized();
            }

            // Optional: Verify if the user is part of the project before returning messages
            // For now, we will return the messages for the given project
            var messages = await _context.ProjectMessages
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

            return Ok(result);
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

        // DELETE: api/Messages/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMessage(int id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int currentUserId)) return Unauthorized();

            var message = await _context.Messages.FindAsync(id);
            if (message == null) return NotFound();
            if (message.SenderId != currentUserId) return Forbid(); // Can only delete own messages

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

            // Broadcast deletion
            await _hubContext.Clients.All.SendAsync("MessageDeleted", id);
            return Ok();
        }

        // DELETE: api/Messages/project/{id}
        [HttpDelete("project/{id}")]
        public async Task<IActionResult> DeleteProjectMessage(int id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int currentUserId)) return Unauthorized();

            var message = await _context.ProjectMessages.FindAsync(id);
            if (message == null) return NotFound();
            if (message.SenderId != currentUserId) return Forbid();

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
            return Ok();
        }
    }
}
