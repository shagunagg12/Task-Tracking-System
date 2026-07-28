using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminProjectsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminProjectsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/AdminProjects/users
        [HttpGet("users")]
        public async Task<IActionResult> GetUsersWithProjects()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    Projects = u.Projects.Select(p => new
                    {
                        p.Id,
                        p.Name,
                        p.Status,
                        p.PriorityTaskTitle,
                        p.PriorityTaskDesc,
                        p.PriorityTaskDue,
                        p.PriorityTaskTimeRemaining,
                        p.Hours,
                        p.HoursTrend,
                        TeamMembers = p.TeamMembers.ToList(),
                        Deadlines = p.Deadlines.ToList(),
                        Feedbacks = p.Feedbacks.ToList(),
                        Tasks = p.Tasks.Select(t => new
                        {
                            t.Id,
                            t.Title,
                            t.Description,
                            t.Status,
                            t.StatusClass
                        }).ToList()
                    }).ToList()
                })
                .ToListAsync();

            return Ok(users);
        }

        public class CreateProjectDto
        {
            public int UserId { get; set; }
            public string Name { get; set; } = string.Empty;
            
            // Priority Task Details
            public string? PriorityTaskTitle { get; set; }
            public string? PriorityTaskDesc { get; set; }
            public string? PriorityTaskDue { get; set; }
            public string? PriorityTaskTimeRemaining { get; set; }
            public double? Hours { get; set; }
            public string? HoursTrend { get; set; }
            
            // Team Member
            public string? TeamMemberName { get; set; }
            
            // Deadline
            public string? DeadlineTitle { get; set; }
            public string? DeadlineDesc { get; set; }
            public string? DeadlineDay { get; set; }
            public string? DeadlineMonth { get; set; }
            public string? DeadlineColor { get; set; }
            
            // Feedback
            public string? FeedbackText { get; set; }
            public string? FeedbackAuthorName { get; set; }
        }

        // POST: api/AdminProjects
        [HttpPost]
        public async Task<IActionResult> CreateProject([FromBody] CreateProjectDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) return NotFound("User not found");

            var project = new Project
            {
                UserId = dto.UserId,
                Name = dto.Name,
                Status = "In Progress",
                PriorityTaskTitle = dto.PriorityTaskTitle ?? string.Empty,
                PriorityTaskDesc = dto.PriorityTaskDesc ?? string.Empty,
                PriorityTaskDue = dto.PriorityTaskDue ?? string.Empty,
                PriorityTaskTimeRemaining = dto.PriorityTaskTimeRemaining ?? string.Empty,
                Hours = dto.Hours ?? 0,
                HoursTrend = dto.HoursTrend ?? string.Empty
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync(); // Save to get the Project.Id

            // Add Team Member if provided
            if (!string.IsNullOrWhiteSpace(dto.TeamMemberName))
            {
                _context.ProjectTeamMembers.Add(new ProjectTeamMember
                {
                    ProjectId = project.Id,
                    Name = dto.TeamMemberName,
                    Image = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(dto.TeamMemberName)}&background=random"
                });
            }

            // Add Deadline if provided
            if (!string.IsNullOrWhiteSpace(dto.DeadlineTitle))
            {
                _context.ProjectDeadlines.Add(new ProjectDeadline
                {
                    ProjectId = project.Id,
                    Title = dto.DeadlineTitle,
                    Description = dto.DeadlineDesc ?? string.Empty,
                    Day = dto.DeadlineDay ?? string.Empty,
                    Month = dto.DeadlineMonth ?? string.Empty,
                    Color = string.IsNullOrEmpty(dto.DeadlineColor) ? "green" : dto.DeadlineColor
                });
            }

            // Add Feedback if provided
            if (!string.IsNullOrWhiteSpace(dto.FeedbackText) && !string.IsNullOrWhiteSpace(dto.FeedbackAuthorName))
            {
                _context.ProjectFeedbacks.Add(new ProjectFeedback
                {
                    ProjectId = project.Id,
                    Text = dto.FeedbackText,
                    AuthorName = dto.FeedbackAuthorName,
                    AuthorImage = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(dto.FeedbackAuthorName)}&background=random"
                });
            }

            await _context.SaveChangesAsync();

            return Ok(project);
        }

        public class CreateTaskDto
        {
            public string Title { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
        }

        // POST: api/AdminProjects/5/tasks
        [HttpPost("{projectId}/tasks")]
        public async Task<IActionResult> CreateTask(int projectId, [FromBody] CreateTaskDto dto)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return NotFound("Project not found");

            var task = new ProjectTask
            {
                ProjectId = projectId,
                Title = dto.Title,
                Description = dto.Description,
                Status = "Pending",
                StatusClass = "pending"
            };

            _context.ProjectTasks.Add(task);
            await _context.SaveChangesAsync();

            return Ok(new { task.Id, task.Title, task.Description, task.Status, task.StatusClass });
        }

        public class UpdateTaskStatusDto
        {
            public string Status { get; set; } = string.Empty;
            public string StatusClass { get; set; } = string.Empty;
        }

        [HttpPatch("tasks/{taskId}/status")]
        public async Task<IActionResult> UpdateTaskStatus(int taskId, [FromBody] UpdateTaskStatusDto dto)
        {
            var task = await _context.ProjectTasks.FindAsync(taskId);
            if (task == null) return NotFound("Task not found");

            task.Status = dto.Status;
            task.StatusClass = dto.StatusClass;

            await _context.SaveChangesAsync();
            return Ok(task);
        }
        public class UpdateProjectDetailsDto
        {
            public string PriorityTaskTitle { get; set; } = string.Empty;
            public string PriorityTaskDesc { get; set; } = string.Empty;
            public string PriorityTaskDue { get; set; } = string.Empty;
            public string PriorityTaskTimeRemaining { get; set; } = string.Empty;
            public double Hours { get; set; }
            public string HoursTrend { get; set; } = string.Empty;
        }

        [HttpPatch("{projectId}/details")]
        public async Task<IActionResult> UpdateProjectDetails(int projectId, [FromBody] UpdateProjectDetailsDto dto)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return NotFound("Project not found");

            project.PriorityTaskTitle = dto.PriorityTaskTitle;
            project.PriorityTaskDesc = dto.PriorityTaskDesc;
            project.PriorityTaskDue = dto.PriorityTaskDue;
            project.PriorityTaskTimeRemaining = dto.PriorityTaskTimeRemaining;
            project.Hours = dto.Hours;
            project.HoursTrend = dto.HoursTrend;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Project details updated", project });
        }

        public class AddTeamMemberDto
        {
            public string Name { get; set; } = string.Empty;
        }

        [HttpPost("{projectId}/team-members")]
        public async Task<IActionResult> AddTeamMember(int projectId, [FromBody] AddTeamMemberDto dto)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return NotFound("Project not found");

            var member = new ProjectTeamMember
            {
                ProjectId = projectId,
                Name = dto.Name,
                Image = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(dto.Name)}&background=random"
            };

            _context.ProjectTeamMembers.Add(member);
            await _context.SaveChangesAsync();
            return Ok(member);
        }

        public class AddDeadlineDto
        {
            public string Title { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public string Day { get; set; } = string.Empty;
            public string Month { get; set; } = string.Empty;
            public string Color { get; set; } = string.Empty;
        }

        [HttpPost("{projectId}/deadlines")]
        public async Task<IActionResult> AddDeadline(int projectId, [FromBody] AddDeadlineDto dto)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return NotFound("Project not found");

            var deadline = new ProjectDeadline
            {
                ProjectId = projectId,
                Title = dto.Title,
                Description = dto.Description,
                Day = dto.Day,
                Month = dto.Month,
                Color = string.IsNullOrEmpty(dto.Color) ? "green" : dto.Color
            };

            _context.ProjectDeadlines.Add(deadline);
            await _context.SaveChangesAsync();
            return Ok(deadline);
        }

        public class AddFeedbackDto
        {
            public string Text { get; set; } = string.Empty;
            public string AuthorName { get; set; } = string.Empty;
        }

        [HttpPost("{projectId}/feedback")]
        public async Task<IActionResult> AddFeedback(int projectId, [FromBody] AddFeedbackDto dto)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return NotFound("Project not found");

            var feedback = new ProjectFeedback
            {
                ProjectId = projectId,
                Text = dto.Text,
                AuthorName = dto.AuthorName,
                AuthorImage = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(dto.AuthorName)}&background=random"
            };

            _context.ProjectFeedbacks.Add(feedback);
            await _context.SaveChangesAsync();
            return Ok(feedback);
        }
    }
}
