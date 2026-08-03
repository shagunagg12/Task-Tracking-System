using Backend.Data;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly ApplicationDbContext _context;

        public AnalyticsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<DepartmentFilterDto>> GetDepartmentFiltersAsync()
        {
            return await _context.Departments
                .Select(d => new DepartmentFilterDto { Name = d.Name })
                .ToListAsync();
        }

        public async Task<List<UserFilterDto>> GetUserFiltersAsync()
        {
            return await _context.Users
                .Select(u => new UserFilterDto { Id = u.Id, FullName = u.FullName })
                .ToListAsync();
        }

        public async Task<OrganizationAnalyticsDto> GetOrganizationAnalyticsAsync()
        {
            var totalUsers = await _context.Users.AsNoTracking().CountAsync();
            var totalProjects = await _context.Projects.AsNoTracking().CountAsync();
            var allTasks = await _context.ProjectTasks.AsNoTracking().ToListAsync();
            
            var totalTasks = allTasks.Count;
            var completedTasks = allTasks.Count(t => t.Status == "Completed");
            var taskCompletionRate = totalTasks > 0 ? (double)completedTasks / totalTasks * 100 : 0;

            var activeDepartmentsCount = await _context.Departments.AsNoTracking().CountAsync();

            var totalMeetings = await _context.Meetings.AsNoTracking().CountAsync();
            var totalMessages = await _context.Messages.AsNoTracking().CountAsync() + await _context.ProjectMessages.AsNoTracking().CountAsync();
            var totalRewardsRedeemed = await _context.RewardRedemptions.AsNoTracking().CountAsync();

            var deptDist = await _context.Profiles.AsNoTracking()
                .Where(p => !string.IsNullOrEmpty(p.Department))
                .GroupBy(p => p.Department)
                .Select(g => new DepartmentDistributionDto
                {
                    DepartmentName = g.Key,
                    UserCount = g.Count()
                })
                .ToListAsync();

            var taskStatusDist = allTasks
                .GroupBy(t => t.Status)
                .Select(g => new TaskStatusDistributionDto
                {
                    Status = g.Key ?? "Unknown",
                    Count = g.Count()
                })
                .ToList();

            return new OrganizationAnalyticsDto
            {
                TotalUsers = totalUsers,
                TotalProjects = totalProjects,
                TotalTasks = totalTasks,
                CompletedTasks = completedTasks,
                TaskCompletionRate = Math.Round(taskCompletionRate, 2),
                ActiveDepartments = activeDepartmentsCount,
                TotalMeetings = totalMeetings,
                TotalMessages = totalMessages,
                TotalRewardsRedeemed = totalRewardsRedeemed,
                DepartmentDistribution = deptDist,
                TaskStatusDistribution = taskStatusDist
            };
        }

        public async Task<DepartmentAnalyticsDto> GetDepartmentAnalyticsAsync(string departmentName)
        {
            var usersInDept = await _context.Profiles.AsNoTracking()
                .Include(p => p.User)
                .ThenInclude(u => u.Projects)
                .Where(p => p.Department == departmentName)
                .ToListAsync();

            if (!usersInDept.Any())
            {
                throw new KeyNotFoundException("Department not found or has no users.");
            }

            var totalUsers = usersInDept.Count;
            var totalPoints = usersInDept.Sum(p => p.User.Points);
            var averagePoints = totalUsers > 0 ? (double)totalPoints / totalUsers : 0;

            var userIds = usersInDept.Select(p => p.UserId).ToList();
            
            var projects = usersInDept.SelectMany(p => p.User.Projects).DistinctBy(p => p.Id).ToList();
            var totalProjects = projects.Count;

            var projectIds = projects.Select(p => p.Id).ToList();
            var tasks = await _context.ProjectTasks.AsNoTracking()
                .Where(t => projectIds.Contains(t.ProjectId))
                .ToListAsync();

            var totalMeetingsOrganized = await _context.Meetings.AsNoTracking()
                .Where(m => m.OrganizerId.HasValue && userIds.Contains(m.OrganizerId.Value))
                .CountAsync();

            var totalRewardsClaimed = await _context.RewardRedemptions.AsNoTracking()
                .Where(r => userIds.Contains(r.UserId))
                .CountAsync();

            var taskStatusDist = tasks
                .GroupBy(t => t.Status)
                .Select(g => new TaskStatusDistributionDto
                {
                    Status = g.Key ?? "Unknown",
                    Count = g.Count()
                })
                .ToList();

            var topPerformers = usersInDept
                .OrderByDescending(p => p.User.Points)
                .Take(5)
                .Select(p => new TopUserDto
                {
                    UserId = p.UserId,
                    FullName = p.User.FullName,
                    Points = p.User.Points,
                    ProfilePictureUrl = p.User.ProfilePictureUrl ?? string.Empty
                })
                .ToList();

            return new DepartmentAnalyticsDto
            {
                DepartmentName = departmentName,
                TotalUsers = totalUsers,
                TotalProjects = totalProjects,
                TotalPoints = totalPoints,
                AveragePointsPerUser = Math.Round(averagePoints, 2),
                TotalMeetingsOrganized = totalMeetingsOrganized,
                TotalRewardsClaimed = totalRewardsClaimed,
                TopPerformers = topPerformers,
                TaskStatusDistribution = taskStatusDist
            };
        }

        public async Task<UserAnalyticsDto> GetUserAnalyticsAsync(int userId)
        {
            var profile = await _context.Profiles.AsNoTracking()
                .Include(p => p.User)
                .ThenInclude(u => u.Projects)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
            {
                var admin = await _context.Admins.FindAsync(userId);
                if (admin != null)
                {
                    profile = await _context.Profiles.AsNoTracking()
                        .Include(p => p.User)
                        .ThenInclude(u => u.Projects)
                        .FirstOrDefaultAsync(p => p.User.Email == admin.Email);
                }
            }

            if (profile == null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            var projectIds = profile.User.Projects.Select(p => p.Id).ToList();
            var tasks = await _context.ProjectTasks.AsNoTracking()
                .Where(t => projectIds.Contains(t.ProjectId))
                .ToListAsync();

            var totalTasks = tasks.Count;
            var completedTasks = tasks.Count(t => t.Status == "Completed" || t.Status == "Done");
            var completionRate = totalTasks > 0 ? (double)completedTasks / totalTasks * 100 : 0;

            var meetingsOrganized = await _context.Meetings.AsNoTracking().CountAsync(m => m.OrganizerId == userId);
            
            var directMessagesSent = await _context.Messages.AsNoTracking().CountAsync(m => m.SenderId == userId);
            var projectMessagesSent = await _context.ProjectMessages.AsNoTracking().CountAsync(m => m.SenderId == userId);
            var messagesSent = directMessagesSent + projectMessagesSent;
            
            var rewardsClaimed = await _context.RewardRedemptions.AsNoTracking().CountAsync(r => r.UserId == userId);

            var taskStatusDist = tasks
                .GroupBy(t => t.Status)
                .Select(g => new TaskStatusDistributionDto
                {
                    Status = g.Key ?? "Unknown",
                    Count = g.Count()
                })
                .ToList();

            return new UserAnalyticsDto
            {
                UserId = profile.UserId,
                FullName = profile.User.FullName,
                Department = profile.Department,
                TotalPoints = profile.User.Points,
                TotalProjects = profile.User.Projects.Count,
                CompletedProjects = profile.User.Projects.Count(p => p.Status == "Completed" || p.Status == "Done"),
                TotalTasksAssigned = totalTasks,
                TasksCompleted = completedTasks,
                CompletionRate = Math.Round(completionRate, 2),
                MeetingsOrganized = meetingsOrganized,
                MessagesSent = messagesSent,
                RewardsClaimed = rewardsClaimed,
                TaskStatusDistribution = taskStatusDist
            };
        }
    }
}
