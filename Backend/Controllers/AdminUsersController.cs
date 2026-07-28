using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminUsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminUsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    Role = "Employee",
                    Status = "Active",
                    Avatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(u.FullName)}&background=random"
                })
                .ToListAsync();

            return Ok(users);
        }

        public class CreateUserDto
        {
            public string FullName { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest("Email already exists");
            }

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                // In a real app, hash this.
                PasswordHash = dto.Password
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var profile = new UserProfile
            {
                UserId = user.Id,
                Designation = "Employee",
                Bio = "New team member",
                Department = "",
                Location = ""
            };
            _context.Profiles.Add(profile);
            await _context.SaveChangesAsync();

            return Ok(new { user.Id, user.FullName, user.Email, Role = "Employee", Status = "Active", Avatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(user.FullName)}&background=random" });
        }

        public class UpdateUserDto
        {
            public string FullName { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound("User not found");

            // check email conflict
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id))
            {
                return BadRequest("Email already exists");
            }

            user.FullName = dto.FullName;
            user.Email = dto.Email;
            
            await _context.SaveChangesAsync();

            return Ok(new { user.Id, user.FullName, user.Email, Role = "Employee", Status = "Active", Avatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(user.FullName)}&background=random" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deleted successfully" });
        }

        [HttpGet("{id}/insights")]
        public async Task<IActionResult> GetUserInsights(int id)
        {
            var user = await _context.Users
                .Include(u => u.Projects)
                    .ThenInclude(p => p.Tasks)
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return NotFound("User not found");

            // Compute insights
            var totalProjects = user.Projects.Count;
            var activeProjects = user.Projects.Count(p => p.Status != "Completed");
            
            var allTasks = user.Projects.SelectMany(p => p.Tasks).ToList();
            var totalTasks = allTasks.Count;
            var completedTasks = allTasks.Count(t => t.Status == "Completed" || t.Status == "Done");

            var recentProjects = user.Projects
                .OrderByDescending(p => p.Id)
                .Take(3)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Status
                });

            return Ok(new
            {
                TotalProjects = totalProjects,
                ActiveProjects = activeProjects,
                TotalTasks = totalTasks,
                CompletedTasks = completedTasks,
                CompletionRate = totalTasks > 0 ? (int)((double)completedTasks / totalTasks * 100) : 0,
                RecentProjects = recentProjects,
                Profile = user.Profile != null ? new 
                {
                    user.Profile.Designation,
                    user.Profile.Department,
                    user.Profile.Location,
                    user.Profile.Bio
                } : null
            });
        }
    }
}
