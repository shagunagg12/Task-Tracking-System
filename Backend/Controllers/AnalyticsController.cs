using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // [Authorize(Roles = "SuperAdmin")] // Uncomment for strict authorization
    public class AnalyticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AnalyticsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("filters/departments")]
        public async Task<ActionResult<List<DepartmentFilterDto>>> GetDepartmentFilters()
        {
            // Assuming we use Departments table directly or distinct departments from Profiles
            var departments = await _context.Departments
                .Select(d => new DepartmentFilterDto { Name = d.Name })
                .ToListAsync();

            return Ok(departments);
        }

        [HttpGet("filters/users")]
        public async Task<ActionResult<List<UserFilterDto>>> GetUserFilters()
        {
            var users = await _context.Users
                .Select(u => new UserFilterDto { Id = u.Id, FullName = u.FullName })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("organization")]
        public async Task<ActionResult<OrganizationAnalyticsDto>> GetOrganizationAnalytics()
        {
            var totalUsers = await _context.Users.CountAsync();
            var totalProjects = await _context.Projects.CountAsync();
            var allTasks = await _context.ProjectTasks.ToListAsync();
            
            var totalTasks = allTasks.Count;
            var completedTasks = allTasks.Count(t => t.Status == "Completed");
            var taskCompletionRate = totalTasks > 0 ? (double)completedTasks / totalTasks * 100 : 0;

            var activeDepartmentsCount = await _context.Departments.CountAsync();

            var totalMeetings = await _context.Meetings.CountAsync();
            var totalMessages = await _context.Messages.CountAsync() + await _context.ProjectMessages.CountAsync();
            var totalRewardsRedeemed = await _context.RewardRedemptions.CountAsync();

            var deptDist = await _context.Profiles
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

            var dto = new OrganizationAnalyticsDto
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

            return Ok(dto);
        }

        [HttpGet("department/{departmentName}")]
        public async Task<ActionResult<DepartmentAnalyticsDto>> GetDepartmentAnalytics(string departmentName)
        {
            var usersInDept = await _context.Profiles
                .Include(p => p.User)
                .ThenInclude(u => u.Projects)
                .Where(p => p.Department == departmentName)
                .ToListAsync();

            if (!usersInDept.Any())
            {
                return NotFound("Department not found or has no users.");
            }

            var totalUsers = usersInDept.Count;
            var totalPoints = usersInDept.Sum(p => p.User.Points);
            var averagePoints = totalUsers > 0 ? (double)totalPoints / totalUsers : 0;

            var userIds = usersInDept.Select(p => p.UserId).ToList();
            
            var projects = usersInDept.SelectMany(p => p.User.Projects).DistinctBy(p => p.Id).ToList();
            var totalProjects = projects.Count;

            var projectIds = projects.Select(p => p.Id).ToList();
            var tasks = await _context.ProjectTasks
                .Where(t => projectIds.Contains(t.ProjectId))
                .ToListAsync();

            var totalMeetingsOrganized = await _context.Meetings
                .Where(m => m.OrganizerId.HasValue && userIds.Contains(m.OrganizerId.Value))
                .CountAsync();

            var totalRewardsClaimed = await _context.RewardRedemptions
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

            var dto = new DepartmentAnalyticsDto
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

            return Ok(dto);
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<UserAnalyticsDto>> GetUserAnalytics(int userId)
        {
            var profile = await _context.Profiles
                .Include(p => p.User)
                .ThenInclude(u => u.Projects)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
            {
                // Try checking if this is an admin ID
                var admin = await _context.Admins.FindAsync(userId);
                if (admin != null)
                {
                    profile = await _context.Profiles
                        .Include(p => p.User)
                        .ThenInclude(u => u.Projects)
                        .FirstOrDefaultAsync(p => p.User.Email == admin.Email);
                }
            }

            if (profile == null)
            {
                return NotFound("User not found.");
            }

            var projectIds = profile.User.Projects.Select(p => p.Id).ToList();
            var tasks = await _context.ProjectTasks
                .Where(t => projectIds.Contains(t.ProjectId))
                .ToListAsync();

            var totalTasks = tasks.Count;
            var completedTasks = tasks.Count(t => t.Status == "Completed" || t.Status == "Done");
            var completionRate = totalTasks > 0 ? (double)completedTasks / totalTasks * 100 : 0;

            var meetingsOrganized = await _context.Meetings.CountAsync(m => m.OrganizerId == userId);
            
            var directMessagesSent = await _context.Messages.CountAsync(m => m.SenderId == userId);
            var projectMessagesSent = await _context.ProjectMessages.CountAsync(m => m.SenderId == userId);
            var messagesSent = directMessagesSent + projectMessagesSent;
            
            var rewardsClaimed = await _context.RewardRedemptions.CountAsync(r => r.UserId == userId);

            var taskStatusDist = tasks
                .GroupBy(t => t.Status)
                .Select(g => new TaskStatusDistributionDto
                {
                    Status = g.Key ?? "Unknown",
                    Count = g.Count()
                })
                .ToList();

            var dto = new UserAnalyticsDto
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

            return Ok(dto);
        }
    }
}
