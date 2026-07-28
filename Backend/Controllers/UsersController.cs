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
                    email = u.Email
                })
                .ToListAsync();

            var users = dbUsers.Select(u => new
            {
                id = u.id,
                name = string.IsNullOrEmpty(u.name) ? u.email : u.name,
                email = u.email,
                avatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(string.IsNullOrEmpty(u.name) ? u.email : u.name)}&background=random"
            });

            return Ok(users);
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
