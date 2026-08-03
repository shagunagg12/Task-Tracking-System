using Backend.Data;
using Backend.DTOs;
using Backend.Hubs;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class AdminUsersService : IAdminUsersService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<AdminDashboardHub> _hubContext;

        public AdminUsersService(ApplicationDbContext context, IHubContext<AdminDashboardHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task<object> GetUsersAsync()
        {
            return await _context.Users.AsNoTracking()
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    Role = _context.Admins.Any(a => a.Email == u.Email) ? "Admin" : "Employee",
                    Status = u.IsActive ? "ACTIVE" : "BLOCKED",
                    Avatar = !string.IsNullOrEmpty(u.ProfilePictureUrl) ? u.ProfilePictureUrl : (!string.IsNullOrEmpty(_context.Admins.AsNoTracking().Where(a => a.Email == u.Email).Select(a => a.ProfilePictureUrl).FirstOrDefault()) ? _context.Admins.AsNoTracking().Where(a => a.Email == u.Email).Select(a => a.ProfilePictureUrl).FirstOrDefault() : $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(u.FullName)}&background=random")
                })
                .ToListAsync();
        }

        public async Task<bool> PromoteToAdminAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) throw new System.Collections.Generic.KeyNotFoundException("User not found");

            if (await _context.Admins.AnyAsync(a => a.Email == user.Email))
            {
                throw new InvalidOperationException("User is already an Admin");
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

            return true;
        }

        public async Task<bool> DemoteFromAdminAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) throw new System.Collections.Generic.KeyNotFoundException("User not found");

            var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == user.Email);
            if (admin == null)
            {
                throw new InvalidOperationException("User is not an Admin");
            }

            _context.Admins.Remove(admin);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<object> CreateUserAsync(CreateUserDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                throw new InvalidOperationException("Email already exists");
            }

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
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

            return new { user.Id, user.FullName, user.Email, Role = "Employee", Status = "Active", Avatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(user.FullName)}&background=random" };
        }

        public async Task<object> UpdateUserAsync(int id, UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) throw new System.Collections.Generic.KeyNotFoundException("User not found");

            if (await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id))
            {
                throw new InvalidOperationException("Email already exists");
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

            return new { user.Id, user.FullName, user.Email, Role = admin != null ? "Admin" : "Employee", Status = user.IsActive ? "ACTIVE" : "BLOCKED", Avatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(user.FullName)}&background=random" };
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<object> ToggleUserStatusAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) throw new System.Collections.Generic.KeyNotFoundException("User not found");

            user.IsActive = !user.IsActive;
            await _context.SaveChangesAsync();

            if (!user.IsActive)
            {
                await _hubContext.Clients.All.SendAsync("ForceLogout", user.Id);
            }

            return new { message = $"User {(user.IsActive ? "unblocked" : "blocked")} successfully" };
        }

        public async Task<object> GetUserInsightsAsync(int id)
        {
            var user = await _context.Users.AsNoTracking()
                .Include(u => u.Projects)
                    .ThenInclude(p => p.Tasks)
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) throw new System.Collections.Generic.KeyNotFoundException("User not found");

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

            var admin = await _context.Admins.AsNoTracking().FirstOrDefaultAsync(a => a.Email == user.Email);
            
            var profileData = new {
                Designation = admin != null && !string.IsNullOrEmpty(admin.Designation) ? admin.Designation : user.Profile?.Designation,
                Department = admin != null && !string.IsNullOrEmpty(admin.Department) ? admin.Department : user.Profile?.Department,
                Location = admin != null && !string.IsNullOrEmpty(admin.Location) ? admin.Location : user.Profile?.Location,
                Bio = admin != null && !string.IsNullOrEmpty(admin.Bio) ? admin.Bio : user.Profile?.Bio
            };

            return new
            {
                TotalProjects = totalProjects,
                ActiveProjects = activeProjects,
                TotalTasks = totalTasks,
                CompletedTasks = completedTasks,
                CompletionRate = totalTasks > 0 ? (int)((double)completedTasks / totalTasks * 100) : 0,
                RecentProjects = recentProjects,
                Profile = profileData
            };
        }
    }
}
