using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChatsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/chats/sessions
        [HttpGet("sessions")]
        public async Task<IActionResult> GetMySessions()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized();
            }

            // Seed/sync group chats from projects if needed
            var myProjects = await _context.Projects
                .Include(p => p.TeamMembers)
                .Where(p => p.UserId == userId || p.TeamMembers.Any(tm => tm.Name == User.Identity.Name))
                .ToListAsync();

            foreach (var project in myProjects)
            {
                // Check if a group chat exists for this project name
                var existingSession = await _context.ChatSessions
                    .FirstOrDefaultAsync(cs => cs.Name == project.Name && cs.IsGroupChat);

                if (existingSession == null)
                {
                    existingSession = new ChatSession
                    {
                        Name = project.Name,
                        IsGroupChat = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.ChatSessions.Add(existingSession);
                    await _context.SaveChangesAsync();
                }

                // Ensure user is in session
                var isMember = await _context.ChatSessionMembers
                    .AnyAsync(m => m.ChatSessionId == existingSession.Id && m.UserId == userId);
                
                if (!isMember)
                {
                    _context.ChatSessionMembers.Add(new ChatSessionMember
                    {
                        ChatSessionId = existingSession.Id,
                        UserId = userId
                    });
                    await _context.SaveChangesAsync();
                }
            }

            // Get all sessions for this user
            var sessions = await _context.ChatSessionMembers
                .Where(m => m.UserId == userId)
                .Include(m => m.ChatSession)
                .Select(m => new
                {
                    id = m.ChatSession.Id,
                    name = m.ChatSession.Name,
                    isGroup = m.ChatSession.IsGroupChat,
                    lastMessage = "Welcome!", // Could be fetched with another subquery
                    time = "Just now",
                    status = "online",
                    avatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(m.ChatSession.Name ?? "Chat")}&background=random"
                })
                .ToListAsync();

            return Ok(sessions);
        }

        // GET: api/chats/{sessionId}/messages
        [HttpGet("{sessionId}/messages")]
        public async Task<IActionResult> GetMessages(int sessionId, [FromQuery] int skip = 0, [FromQuery] int take = 50)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized();
            }

            // Check if user is in session
            var isMember = await _context.ChatSessionMembers
                .AnyAsync(m => m.ChatSessionId == sessionId && m.UserId == userId);

            if (!isMember)
            {
                return Forbid();
            }

            // Get paginated messages
            var messages = await _context.ChatMessages
                .Where(m => m.ChatSessionId == sessionId)
                .OrderByDescending(m => m.CreatedAt) // newest first for pagination
                .Skip(skip)
                .Take(take)
                .Include(m => m.Sender)
                .Select(m => new
                {
                    id = m.Id,
                    senderId = m.SenderId,
                    senderName = m.Sender.FullName,
                    text = m.Text,
                    createdAt = m.CreatedAt,
                    time = m.CreatedAt.ToString("HH:mm")
                })
                .ToListAsync();

            return Ok(messages);
        }
    }
}
