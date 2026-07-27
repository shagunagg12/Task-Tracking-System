using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System.Security.Claims;

namespace Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProjectsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            var projects = await _context.Projects
                .Include(p => p.Tasks)
                .Include(p => p.Deadlines)
                .Include(p => p.Feedbacks)
                .Include(p => p.TeamMembers)
                .Where(p => p.UserId == userId)
                .ToListAsync();

            return Ok(projects);
        }

        [AllowAnonymous]
        [HttpPost("seed-dummy-data")]
        public async Task<IActionResult> SeedDummyData()
        {
            var users = await _context.Users.ToListAsync();
            if (!users.Any()) return BadRequest("No users found to seed data for.");

            int addedCount = 0;

            foreach (var user in users)
            {
                // Check if user already has projects
                var hasProjects = await _context.Projects.AnyAsync(p => p.UserId == user.Id);
                if (hasProjects) continue;

                var proj1 = new Project
                {
                    UserId = user.Id,
                    Name = "Website Redesign (Phase 2)",
                    PriorityTaskTitle = "Website Redesign (Phase 2)",
                    PriorityTaskDesc = "Complete the frontend overhaul for the client portal.",
                    PriorityTaskDue = "Aug 15",
                    PriorityTaskTimeRemaining = "12h remaining",
                    Progress = 75,
                    Hours = 128.5,
                    HoursTrend = "↗ 12%",
                    Tasks = new List<ProjectTask>
                    {
                        new ProjectTask { Title = "Design System Update", Description = "Update color tokens", Status = "Done", StatusClass = "status-done" },
                        new ProjectTask { Title = "API Integration", Description = "Connect user endpoints", Status = "In Progress", StatusClass = "status-inprogress" },
                        new ProjectTask { Title = "Code Review", Description = "Review PR #42", Status = "Review", StatusClass = "status-review" }
                    },
                    Deadlines = new List<ProjectDeadline>
                    {
                        new ProjectDeadline { Day = "05", Month = "Aug", Title = "Design Sign-off", Description = "Client approval needed", Color = "red" },
                        new ProjectDeadline { Day = "15", Month = "Aug", Title = "Final Delivery", Description = "Production deployment", Color = "green" }
                    },
                    Feedbacks = new List<ProjectFeedback>
                    {
                        new ProjectFeedback { Text = "\"The new glassmorphic design looks incredible. Great work on the animations!\"", AuthorName = "Sarah, Project Manager", AuthorImage = "https://ui-avatars.com/api/?name=Sarah+Manager&background=random" }
                    },
                    TeamMembers = new List<ProjectTeamMember>
                    {
                        new ProjectTeamMember { Name = "Alice", Image = "https://ui-avatars.com/api/?name=Alice+Wonder&background=random" },
                        new ProjectTeamMember { Name = "Bob", Image = "https://ui-avatars.com/api/?name=Bob+Builder&background=random" }
                    }
                };

                var proj2 = new Project
                {
                    UserId = user.Id,
                    Name = "Mobile App Launch",
                    PriorityTaskTitle = "Fix Authentication Bug",
                    PriorityTaskDesc = "Users are experiencing intermittent logouts on iOS 17.",
                    PriorityTaskDue = "Aug 10",
                    PriorityTaskTimeRemaining = "24h remaining",
                    Progress = 45,
                    Hours = 85.0,
                    HoursTrend = "↗ 8%",
                    Tasks = new List<ProjectTask>
                    {
                        new ProjectTask { Title = "Test Token Refresh", Description = "Simulate expiry", Status = "Done", StatusClass = "status-done" },
                        new ProjectTask { Title = "Patch iOS Bug", Description = "Update Keychain logic", Status = "In Progress", StatusClass = "status-inprogress" }
                    },
                    Deadlines = new List<ProjectDeadline>
                    {
                        new ProjectDeadline { Day = "10", Month = "Aug", Title = "Hotfix Release", Description = "Fix auth bug", Color = "red" }
                    },
                    Feedbacks = new List<ProjectFeedback>
                    {
                        new ProjectFeedback { Text = "\"Thanks for jumping on that iOS bug so quickly. We need it fixed ASAP.\"", AuthorName = "David, Tech Lead", AuthorImage = "https://ui-avatars.com/api/?name=David+Lead&background=random" }
                    },
                    TeamMembers = new List<ProjectTeamMember>
                    {
                        new ProjectTeamMember { Name = "Grace", Image = "https://ui-avatars.com/api/?name=Grace+Hopper&background=random" }
                    }
                };

                _context.Projects.AddRange(proj1, proj2);
                addedCount++;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Successfully seeded dummy projects for {addedCount} users." });
        }
    }
}
