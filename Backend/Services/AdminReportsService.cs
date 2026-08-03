using Backend.Data;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class AdminReportsService : IAdminReportsService
    {
        private readonly ApplicationDbContext _context;

        public AdminReportsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetOverviewAsync()
        {
            var projects = await _context.Projects.AsNoTracking()
                .Include(p => p.Tasks)
                .Include(p => p.Deadlines)
                .Include(p => p.Feedbacks)
                .Include(p => p.TeamMembers)
                .ToListAsync();

            var users = await _context.Users.AsNoTracking()
                .Include(u => u.Projects)
                    .ThenInclude(p => p.Tasks)
                .Include(u => u.Profile)
                .ToListAsync();

            var userReports = users.Select(u => new
            {
                Id = u.Id,
                Name = u.FullName,
                Email = u.Email,
                Department = u.Profile?.Department ?? "Unassigned",
                TotalProjects = u.Projects.Count,
                TotalTasks = u.Projects.SelectMany(p => p.Tasks).Count(),
                CompletedTasks = u.Projects.SelectMany(p => p.Tasks).Count(t => t.Status == "Completed" || t.Status == "Done"),
                InProgressTasks = u.Projects.SelectMany(p => p.Tasks).Count(t => t.Status == "In Progress"),
                PendingTasks = u.Projects.SelectMany(p => p.Tasks).Count(t => t.Status == "Todo"),
                BlockedTasks = u.Projects.SelectMany(p => p.Tasks).Count(t => t.Status == "Blocked"),
                Avatar = !string.IsNullOrEmpty(u.ProfilePictureUrl) ? u.ProfilePictureUrl : (!string.IsNullOrEmpty(_context.Admins.AsNoTracking().Where(a => a.Email == u.Email).Select(a => a.ProfilePictureUrl).FirstOrDefault()) ? _context.Admins.AsNoTracking().Where(a => a.Email == u.Email).Select(a => a.ProfilePictureUrl).FirstOrDefault() : $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(u.FullName)}&background=random")
            })
            .OrderByDescending(u => u.CompletedTasks)
            .ToList();

            return new
            {
                Projects = projects,
                UserReports = userReports
            };
        }
    }
}
