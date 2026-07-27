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

        [HttpPatch("tasks/{taskId}/status")]
        public async Task<IActionResult> UpdateTaskStatus(int taskId, [FromBody] UpdateTaskStatusRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            var task = await _context.ProjectTasks
                .Include(t => t.Project)
                .FirstOrDefaultAsync(t => t.Id == taskId && t.Project.UserId == userId);

            if (task == null) return NotFound(new { message = "Task not found." });

            task.Status = request.Status;
            if (request.Status == "Done") task.StatusClass = "status-done";
            else if (request.Status == "In Progress") task.StatusClass = "status-inprogress";
            else if (request.Status == "Review") task.StatusClass = "status-review";
            else task.StatusClass = ""; // fallback
            
            await _context.SaveChangesAsync();
            return Ok(new { message = "Status updated successfully", task });
        }

        [HttpPatch("{projectId}/status")]
        public async Task<IActionResult> UpdateProjectStatus(int projectId, [FromBody] UpdateProjectStatusRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == projectId && p.UserId == userId);

            if (project == null) return NotFound(new { message = "Project not found." });

            project.Status = request.Status;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Project status updated successfully", project });
        }

        [AllowAnonymous]
        [HttpPost("seed-dummy-data")]
        public async Task<IActionResult> SeedDummyData()
        {
            var users = await _context.Users.ToListAsync();
            if (!users.Any()) return BadRequest("No users found to seed data for.");

            // Clear all existing projects to avoid duplicates during reseeding
            _context.Projects.RemoveRange(await _context.Projects.ToListAsync());
            await _context.SaveChangesAsync();

            int addedCount = 0;
            var random = new Random();

            var projectTitles = new[] { "Website Redesign", "Mobile App Launch", "Backend Refactoring", "Marketing Campaign", "SEO Optimization", "Cloud Migration", "Data Pipeline", "Security Audit", "Brand Refresh", "AI Integration" };
            var taskTitles = new[] { "Design Update", "API Integration", "Code Review", "Bug Fixing", "Deploy", "Testing", "Documentation", "Client Feedback", "Database Setup", "Performance Tuning" };
            var taskStatuses = new[] { "Done", "In Progress", "Review" };
            var taskStatusClasses = new[] { "status-done", "status-inprogress", "status-review" };

            foreach (var user in users)
            {
                int numProjects = random.Next(2, 4); // 2 to 3 projects per user
                for (int i = 0; i < numProjects; i++)
                {
                    string projTitle = projectTitles[random.Next(projectTitles.Length)];
                    
                    var proj = new Project
                    {
                        UserId = user.Id,
                        Name = projTitle,
                        PriorityTaskTitle = taskTitles[random.Next(taskTitles.Length)],
                        PriorityTaskDesc = "High priority task that needs immediate attention.",
                        PriorityTaskDue = $"Aug {random.Next(1, 30)}",
                        PriorityTaskTimeRemaining = $"{random.Next(2, 48)}h remaining",
                        Hours = Math.Round(random.NextDouble() * 200, 1),
                        HoursTrend = $"{(random.NextDouble() > 0.5 ? "↗" : "↘")} {random.Next(1, 20)}%",
                        Tasks = new List<ProjectTask>(),
                        Deadlines = new List<ProjectDeadline>(),
                        Feedbacks = new List<ProjectFeedback>(),
                        TeamMembers = new List<ProjectTeamMember>()
                    };

                    int numTasks = random.Next(2, 5);
                    for (int j = 0; j < numTasks; j++)
                    {
                        int statusIndex = random.Next(taskStatuses.Length);
                        proj.Tasks.Add(new ProjectTask 
                        { 
                            Title = taskTitles[random.Next(taskTitles.Length)], 
                            Description = "Task details here.", 
                            Status = taskStatuses[statusIndex], 
                            StatusClass = taskStatusClasses[statusIndex] 
                        });
                    }

                    int numDeadlines = random.Next(1, 3);
                    var colors = new[] { "red", "orange", "green" };
                    for (int j = 0; j < numDeadlines; j++)
                    {
                        proj.Deadlines.Add(new ProjectDeadline 
                        { 
                            Day = random.Next(1, 30).ToString("D2"), 
                            Month = "Aug", 
                            Title = "Milestone Deadline", 
                            Description = "Important delivery", 
                            Color = colors[random.Next(colors.Length)] 
                        });
                    }

                    proj.Feedbacks.Add(new ProjectFeedback 
                    { 
                        Text = "\"Great work so far, keep it up!\"", 
                        AuthorName = "Manager", 
                        AuthorImage = "https://ui-avatars.com/api/?name=Manager&background=random" 
                    });

                    int numTeam = random.Next(2, 5);
                    var names = new[] { "Alice", "Bob", "Charlie", "Diana", "Ethan", "Frank", "Grace" };
                    for (int j = 0; j < numTeam; j++)
                    {
                        string memberName = names[random.Next(names.Length)];
                        proj.TeamMembers.Add(new ProjectTeamMember 
                        { 
                            Name = memberName, 
                            Image = $"https://ui-avatars.com/api/?name={memberName}&background=random" 
                        });
                    }

                    _context.Projects.Add(proj);
                }
                addedCount++;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Successfully seeded randomized projects for {addedCount} users." });
        }
    }
}
