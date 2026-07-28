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
                .Include(u => u.Projects)
                    .ThenInclude(p => p.Tasks)
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
                Status = "In Progress"
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            return Ok(new { project.Id, project.Name, project.Status, Tasks = new List<object>() });
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
    }
}
