using Backend.Data;
using Backend.DTOs;
using Backend.Hubs;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class AdminProjectsService : IAdminProjectsService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<AdminDashboardHub> _hubContext;

        public AdminProjectsService(ApplicationDbContext context, IHubContext<AdminDashboardHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task<object> GetUsersWithProjectsAsync()
        {
            var users = await _context.Users.AsNoTracking()
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    ProfilePictureUrl = !string.IsNullOrEmpty(u.ProfilePictureUrl) ? u.ProfilePictureUrl : _context.Admins.AsNoTracking().Where(a => a.Email == u.Email).Select(a => a.ProfilePictureUrl).FirstOrDefault(),
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

            var allAdmins = await _context.Admins.AsNoTracking().ToListAsync();
            var allUsersWithPics = await _context.Users.AsNoTracking().ToListAsync();

            foreach (var u in users)
            {
                foreach (var p in u.Projects)
                {
                    foreach (var tm in p.TeamMembers)
                    {
                        var actualUser = allUsersWithPics.FirstOrDefault(x => x.FullName == tm.Name);
                        if (actualUser != null && !string.IsNullOrEmpty(actualUser.ProfilePictureUrl))
                        {
                            tm.Image = actualUser.ProfilePictureUrl;
                        }
                        else
                        {
                            var admin = allAdmins.FirstOrDefault(x => x.FullName == tm.Name);
                            if (admin != null && !string.IsNullOrEmpty(admin.ProfilePictureUrl))
                            {
                                tm.Image = admin.ProfilePictureUrl;
                            }
                        }
                    }
                }
            }

            return users;
        }

        public async Task<Project> CreateProjectAsync(CreateProjectDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) throw new KeyNotFoundException("User not found");

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
            await _context.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(dto.TeamMemberName))
            {
                _context.ProjectTeamMembers.Add(new ProjectTeamMember
                {
                    ProjectId = project.Id,
                    Name = dto.TeamMemberName,
                    Image = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(dto.TeamMemberName)}&background=random"
                });
            }

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

            var notification = new AppNotification
            {
                Title = "New Project Assigned",
                Message = $"Admin assigned project '{project.Name}' to user ID {dto.UserId}.",
                Type = "project_update",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.AppNotifications.Add(notification);
            await _context.SaveChangesAsync();
            
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", notification);
            await _hubContext.Clients.All.SendAsync("ReceiveStatsUpdate");

            return project;
        }

        public async Task<ProjectTask> CreateTaskAsync(int projectId, CreateTaskDto dto)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) throw new KeyNotFoundException("Project not found");

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

            return task;
        }

        public async Task<ProjectTask> UpdateTaskStatusAsync(int taskId, UpdateTaskStatusDto dto)
        {
            var task = await _context.ProjectTasks.FindAsync(taskId);
            if (task == null) throw new KeyNotFoundException("Task not found");

            task.Status = dto.Status;
            task.StatusClass = dto.StatusClass;

            if (dto.Status == "Completed" || dto.Status == "Done") 
            {
                task.CompletedAt = DateTime.UtcNow;
            }
            else 
            {
                task.CompletedAt = null;
            }

            await _context.SaveChangesAsync();
            return task;
        }

        public async Task<ProjectTask> EditTaskAsync(int taskId, EditTaskDto dto)
        {
            var task = await _context.ProjectTasks.FindAsync(taskId);
            if (task == null) throw new KeyNotFoundException("Task not found");

            task.Title = dto.Title;

            await _context.SaveChangesAsync();
            return task;
        }

        public async Task<bool> DeleteTaskAsync(int taskId)
        {
            var task = await _context.ProjectTasks.FindAsync(taskId);
            if (task == null) return false;

            var notifications = await _context.AppNotifications.Where(n => n.TaskId == taskId).ToListAsync();
            _context.AppNotifications.RemoveRange(notifications);

            _context.ProjectTasks.Remove(task);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteProjectAsync(int projectId)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return false;

            var notifications = await _context.AppNotifications.Where(n => n.ProjectId == projectId).ToListAsync();
            _context.AppNotifications.RemoveRange(notifications);

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Project> UpdateProjectDetailsAsync(int projectId, UpdateProjectDetailsDto dto)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) throw new KeyNotFoundException("Project not found");

            project.PriorityTaskTitle = dto.PriorityTaskTitle;
            project.PriorityTaskDesc = dto.PriorityTaskDesc;
            project.PriorityTaskDue = dto.PriorityTaskDue;
            project.PriorityTaskTimeRemaining = dto.PriorityTaskTimeRemaining;
            project.Hours = dto.Hours;
            project.HoursTrend = dto.HoursTrend;

            await _context.SaveChangesAsync();
            return project;
        }

        public async Task<ProjectTeamMember> AddTeamMemberAsync(int projectId, AddTeamMemberDto dto)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) throw new KeyNotFoundException("Project not found");

            var member = new ProjectTeamMember
            {
                ProjectId = projectId,
                Name = dto.Name,
                Image = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(dto.Name)}&background=random"
            };

            _context.ProjectTeamMembers.Add(member);
            await _context.SaveChangesAsync();
            return member;
        }

        public async Task<bool> DeleteTeamMemberAsync(int projectId, int memberId)
        {
            var member = await _context.ProjectTeamMembers.FirstOrDefaultAsync(m => m.Id == memberId && m.ProjectId == projectId);
            if (member == null) return false;

            _context.ProjectTeamMembers.Remove(member);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<ProjectDeadline> AddDeadlineAsync(int projectId, AddDeadlineDto dto)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) throw new KeyNotFoundException("Project not found");

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
            return deadline;
        }

        public async Task<ProjectFeedback> AddFeedbackAsync(int projectId, AddFeedbackDto dto)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) throw new KeyNotFoundException("Project not found");

            var feedback = new ProjectFeedback
            {
                ProjectId = projectId,
                Text = dto.Text,
                AuthorName = dto.AuthorName,
                AuthorImage = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(dto.AuthorName)}&background=random"
            };

            _context.ProjectFeedbacks.Add(feedback);
            await _context.SaveChangesAsync();
            return feedback;
        }
    }
}
