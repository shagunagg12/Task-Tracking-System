using Backend.Data;
using Backend.Hubs;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class ProjectsService : IProjectsService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<AdminDashboardHub> _hubContext;

        public ProjectsService(ApplicationDbContext context, IHubContext<AdminDashboardHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task<object> GetProjectsAsync(ClaimsPrincipal user)
        {
            var email = user.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
            {
                throw new UnauthorizedAccessException();
            }

            int actualUserId;

            var userAccount = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == email);
            if (userAccount != null)
            {
                actualUserId = userAccount.Id;
            }
            else
            {
                var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
                int.TryParse(userIdStr, out actualUserId);
            }

            var projects = await _context.Projects.AsNoTracking()
                .Include(p => p.Tasks)
                .Include(p => p.Deadlines)
                .Include(p => p.Feedbacks)
                .Include(p => p.TeamMembers)
                .Where(p => p.UserId == actualUserId || p.TeamMembers.Any(tm => tm.UserId == actualUserId))
                .ToListAsync();

            var allUsers = await _context.Users.AsNoTracking().ToListAsync();
            var allAdmins = await _context.Admins.AsNoTracking().ToListAsync();

            foreach (var p in projects)
            {
                foreach (var tm in p.TeamMembers)
                {
                    var u = allUsers.FirstOrDefault(x => x.FullName == tm.Name);
                    if (u != null && !string.IsNullOrEmpty(u.ProfilePictureUrl))
                    {
                        tm.Image = u.ProfilePictureUrl;
                    }
                    else
                    {
                        var a = allAdmins.FirstOrDefault(x => x.FullName == tm.Name);
                        if (a != null && !string.IsNullOrEmpty(a.ProfilePictureUrl))
                        {
                            tm.Image = a.ProfilePictureUrl;
                        }
                    }
                }
            }

            return projects;
        }

        public async Task<object> UpdateTaskStatusAsync(ClaimsPrincipal user, int taskId, UpdateTaskStatusRequest request)
        {
            var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                throw new UnauthorizedAccessException();
            }

            var task = await _context.ProjectTasks
                .Include(t => t.Project)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null) throw new KeyNotFoundException("Task not found.");

            task.Status = request.Status;
            if (request.Status == "Completed") task.StatusClass = "status-completed";
            else if (request.Status == "In Progress") task.StatusClass = "status-inprogress";
            else if (request.Status == "Pending") task.StatusClass = "status-pending";
            else if (request.Status == "Blocked") task.StatusClass = "status-blocked";
            else task.StatusClass = ""; 
            
            if (request.Status == "Completed" || request.Status == "Done") 
            {
                task.CompletedAt = DateTime.UtcNow;
            }
            else 
            {
                task.CompletedAt = null;
            }

            await _context.SaveChangesAsync();
            
            var userName = user.FindFirstValue(ClaimTypes.Name) ?? "A user";
            var notification = new AppNotification
            {
                Title = "Task Updated",
                Message = $"{userName} updated task '{task.Title}' to {request.Status}",
                Type = "task_update",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            
            _context.AppNotifications.Add(notification);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("ReceiveNotification", notification);
            await _hubContext.Clients.All.SendAsync("ReceiveStatsUpdate"); 

            return new { message = "Status updated successfully", task };
        }

        public async Task<object> UpdateProjectStatusAsync(ClaimsPrincipal user, int projectId, UpdateProjectStatusRequest request)
        {
            var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                throw new UnauthorizedAccessException();
            }

            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null) throw new KeyNotFoundException("Project not found.");

            project.Status = request.Status;
            await _context.SaveChangesAsync();
            
            var userName = user.FindFirstValue(ClaimTypes.Name) ?? "A user";
            var notification = new AppNotification
            {
                Title = "Project Status Updated",
                Message = $"{userName} updated project '{project.Name}' to {request.Status}",
                Type = "project_update",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.AppNotifications.Add(notification);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("ReceiveNotification", notification);
            await _hubContext.Clients.All.SendAsync("ReceiveStatsUpdate");

            return new { message = "Project status updated successfully", project };
        }

        public async Task<object> SeedDummyDataAsync()
        {
            var users = await _context.Users.ToListAsync();
            if (!users.Any()) throw new Exception("No users found to seed data for.");

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
                int numProjects = random.Next(2, 4); 
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
            return new { message = $"Successfully seeded randomized projects for {addedCount} users." };
        }
    }
}
