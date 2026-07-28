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

            // Get all sessions for this user with members included
            var mySessions = await _context.ChatSessionMembers
                .Where(m => m.UserId == userId)
                .Include(m => m.ChatSession)
                    .ThenInclude(cs => cs.Members)
                        .ThenInclude(csm => csm.User)
                .ToListAsync();

            var sessions = mySessions.Select(m => {
                var cs = m.ChatSession;
                string displayName = cs.Name ?? "Chat";
                string displayAvatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(displayName)}&background=random";
                
                if (!cs.IsGroupChat)
                {
                    var otherMember = cs.Members.FirstOrDefault(x => x.UserId != userId)?.User;
                    displayName = otherMember?.FullName ?? "Unknown User";
                    displayAvatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(displayName)}&background=random";
                }

                return new
                {
                    id = cs.Id,
                    name = displayName,
                    isGroup = cs.IsGroupChat,
                    lastMessage = "Welcome!",
                    time = "Just now",
                    status = "online",
                    avatar = displayAvatar
                };
            }).ToList();

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

        // POST: api/chats/dm/{targetUserId}
        [HttpPost("dm/{targetUserId}")]
        public async Task<IActionResult> GetOrCreateDMSession(int targetUserId)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized();
            }

            if (userId == targetUserId) return BadRequest("Cannot DM yourself.");

            var targetUser = await _context.Users.FindAsync(targetUserId);
            if (targetUser == null) return NotFound("User not found.");

            // Check if DM session already exists between these two users
            var existingSessionId = await _context.ChatSessionMembers
                .Where(m => m.UserId == userId)
                .Join(_context.ChatSessionMembers.Where(m => m.UserId == targetUserId),
                      m1 => m1.ChatSessionId,
                      m2 => m2.ChatSessionId,
                      (m1, m2) => m1.ChatSessionId)
                .Join(_context.ChatSessions.Where(cs => !cs.IsGroupChat),
                      id => id,
                      cs => cs.Id,
                      (id, cs) => id)
                .FirstOrDefaultAsync();

            if (existingSessionId > 0)
            {
                return Ok(new { sessionId = existingSessionId });
            }

            // Create new DM session
            var newSession = new ChatSession
            {
                Name = "Direct Message",
                IsGroupChat = false,
                CreatedAt = DateTime.UtcNow
            };
            
            _context.ChatSessions.Add(newSession);
            await _context.SaveChangesAsync();

            _context.ChatSessionMembers.Add(new ChatSessionMember { ChatSessionId = newSession.Id, UserId = userId });
            _context.ChatSessionMembers.Add(new ChatSessionMember { ChatSessionId = newSession.Id, UserId = targetUserId });
            
            await _context.SaveChangesAsync();

            return Ok(new { sessionId = newSession.Id });
        }
    }
}
