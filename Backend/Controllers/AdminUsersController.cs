using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.SignalR;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminUsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<Backend.Hubs.AdminDashboardHub> _hubContext;

        public AdminUsersController(ApplicationDbContext context, IHubContext<Backend.Hubs.AdminDashboardHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
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
                    Role = _context.Admins.Any(a => a.Email == u.Email) ? "Admin" : "Employee",
                    Status = u.IsActive ? "ACTIVE" : "BLOCKED",
                    Avatar = !string.IsNullOrEmpty(u.ProfilePictureUrl) ? u.ProfilePictureUrl : (!string.IsNullOrEmpty(_context.Admins.Where(a => a.Email == u.Email).Select(a => a.ProfilePictureUrl).FirstOrDefault()) ? _context.Admins.Where(a => a.Email == u.Email).Select(a => a.ProfilePictureUrl).FirstOrDefault() : $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(u.FullName)}&background=random")
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpPost("{id}/promote")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> PromoteToAdmin(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found" });

            if (await _context.Admins.AnyAsync(a => a.Email == user.Email))
            {
                return BadRequest(new { message = "User is already an Admin" });
            }

            var newAdmin = new Admin
            {
                Email = user.Email,
                FullName = user.FullName,
                PasswordHash = user.PasswordHash,
                Designation = "Admin",
                Department = "Management",
                Location = "",
                Bio = "System Administrator",
                ProfilePictureUrl = user.ProfilePictureUrl
            };

            _context.Admins.Add(newAdmin);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User successfully promoted to Admin" });
        }

        [HttpPost("{id}/demote")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> DemoteFromAdmin(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found" });

            var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == user.Email);
            if (admin == null)
            {
                return BadRequest(new { message = "User is not an Admin" });
            }

            _context.Admins.Remove(admin);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User successfully demoted to Employee" });
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
            public string Department { get; set; } = string.Empty;
            public string Designation { get; set; } = string.Empty;
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
            
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == id);
            if (profile != null)
            {
                if (!string.IsNullOrEmpty(dto.Department)) profile.Department = dto.Department;
                if (!string.IsNullOrEmpty(dto.Designation)) profile.Designation = dto.Designation;
            }
            
            var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == user.Email);
            if (admin != null)
            {
                admin.FullName = dto.FullName;
                admin.Email = dto.Email;
                if (!string.IsNullOrEmpty(dto.Department)) admin.Department = dto.Department;
                if (!string.IsNullOrEmpty(dto.Designation)) admin.Designation = dto.Designation;
            }
            
            await _context.SaveChangesAsync();

            return Ok(new { user.Id, user.FullName, user.Email, Role = admin != null ? "Admin" : "Employee", Status = user.IsActive ? "ACTIVE" : "BLOCKED", Avatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(user.FullName)}&background=random" });
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

        [HttpPut("{id}/toggle-status")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> ToggleUserStatus(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found" });

            user.IsActive = !user.IsActive;
            await _context.SaveChangesAsync();

            if (!user.IsActive)
            {
                await _hubContext.Clients.All.SendAsync("ForceLogout", user.Id);
            }

            return Ok(new { message = $"User {(user.IsActive ? "unblocked" : "blocked")} successfully" });
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

            var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == user.Email);
            
            var profileData = new {
                Designation = admin != null && !string.IsNullOrEmpty(admin.Designation) ? admin.Designation : user.Profile?.Designation,
                Department = admin != null && !string.IsNullOrEmpty(admin.Department) ? admin.Department : user.Profile?.Department,
                Location = admin != null && !string.IsNullOrEmpty(admin.Location) ? admin.Location : user.Profile?.Location,
                Bio = admin != null && !string.IsNullOrEmpty(admin.Bio) ? admin.Bio : user.Profile?.Bio
            };

            return Ok(new
            {
                TotalProjects = totalProjects,
                ActiveProjects = activeProjects,
                TotalTasks = totalTasks,
                CompletedTasks = completedTasks,
                CompletionRate = totalTasks > 0 ? (int)((double)completedTasks / totalTasks * 100) : 0,
                RecentProjects = recentProjects,
                Profile = profileData
            });
        }
    }
}
