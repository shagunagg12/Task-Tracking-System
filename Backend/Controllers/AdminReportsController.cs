using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
            var projects = await _context.Projects
                .Include(p => p.Tasks)
                .Include(p => p.Deadlines)
                .Include(p => p.Feedbacks)
                .Include(p => p.TeamMembers)
                .ToListAsync();

            // Return ALL users and their tasks to allow the Admin Panel to show individual reports
            var users = await _context.Users
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
                Avatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(u.FullName)}&background=random"
            })
            .OrderByDescending(u => u.CompletedTasks)
            .ToList();

            return Ok(new
            {
                Projects = projects,
                UserReports = userReports
            });
        }
    }
}
