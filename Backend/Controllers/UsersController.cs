using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized();
            }

            var dbUsers = await _context.Users
                .Where(u => u.Id != currentUserId)
                .Select(u => new
                {
                    id = u.Id,
                    name = u.FullName,
                    email = u.Email,
                    unreadCount = _context.Messages.Count(m => m.SenderId == u.Id && m.ReceiverId == currentUserId && !m.IsRead),
                    lastMessage = _context.Messages
                        .Where(m => (m.SenderId == u.Id && m.ReceiverId == currentUserId) || (m.SenderId == currentUserId && m.ReceiverId == u.Id))
                        .OrderByDescending(m => m.Timestamp)
                        .Select(m => new { m.Timestamp, m.Content, m.FileType })
                        .FirstOrDefault()
                })
                .ToListAsync();

            var users = dbUsers.Select(u => new
            {
                id = u.id,
                name = string.IsNullOrEmpty(u.name) ? u.email : u.name,
                email = u.email,
                avatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(string.IsNullOrEmpty(u.name) ? u.email : u.name)}&background=random",
                unreadCount = u.unreadCount,
                lastMessageTime = u.lastMessage?.Timestamp,
                lastMessageContent = !string.IsNullOrEmpty(u.lastMessage?.Content) ? u.lastMessage.Content : (u.lastMessage?.FileType != null ? "Media message" : "")
            }).OrderByDescending(u => u.lastMessageTime ?? DateTime.MinValue).ToList();

            return Ok(users);
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound("User not found");
            }

            return Ok(new
            {
                id = user.Id,
                name = string.IsNullOrEmpty(user.FullName) ? user.Email : user.FullName,
                email = user.Email,
                designation = user.Profile?.Designation ?? "No Designation",
                department = user.Profile?.Department ?? "",
                avatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(string.IsNullOrEmpty(user.FullName) ? user.Email : user.FullName)}&background=random"
            });
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return Ok(new List<object>());
            }

            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized();
            }

            var query = q.ToLower();
            
            var dbUsers = await _context.Users
                .Where(u => u.Id != currentUserId && u.FullName.ToLower().Contains(query))
                .Select(u => new
                {
                    id = u.Id,
                    name = u.FullName,
                    email = u.Email
                })
                .Take(10)
                .ToListAsync();

            var users = dbUsers.Select(u => new
            {
                id = u.id,
                name = string.IsNullOrEmpty(u.name) ? u.email : u.name,
                avatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(string.IsNullOrEmpty(u.name) ? u.email : u.name)}&background=random"
            });

            return Ok(users);
        }
    }
}
