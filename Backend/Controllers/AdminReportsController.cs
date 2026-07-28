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

            // Compute top performers (users with the most completed tasks)
            var users = await _context.Users
                .Include(u => u.Projects)
                    .ThenInclude(p => p.Tasks)
                .ToListAsync();

            var topPerformers = users.Select(u => new
            {
                Id = u.Id,
                Name = u.FullName,
                Email = u.Email,
                TasksCompleted = u.Projects.SelectMany(p => p.Tasks).Count(t => t.Status == "Completed" || t.Status == "Done"),
                Avatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(u.FullName)}&background=random"
            })
            .OrderByDescending(u => u.TasksCompleted)
            .Take(5)
            .ToList();

            return Ok(new
            {
                Projects = projects,
                TopPerformers = topPerformers
            });
        }
    }
}
