using System.Collections.Generic;

namespace Backend.Models
{
    public class OrganizationAnalyticsDto
    {
        public int TotalUsers { get; set; }
        public int TotalProjects { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public double TaskCompletionRate { get; set; }
        public int ActiveDepartments { get; set; }
        
        // New detailed metrics
        public int TotalMeetings { get; set; }
        public int TotalMessages { get; set; }
        public int TotalRewardsRedeemed { get; set; }
        
        public List<DepartmentDistributionDto> DepartmentDistribution { get; set; } = new();
        public List<TaskStatusDistributionDto> TaskStatusDistribution { get; set; } = new();
    }

    public class DepartmentDistributionDto
    {
        public string DepartmentName { get; set; } = string.Empty;
        public int UserCount { get; set; }
    }

    public class TaskStatusDistributionDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class DepartmentAnalyticsDto
    {
        public string DepartmentName { get; set; } = string.Empty;
        public int TotalUsers { get; set; }
        public int TotalProjects { get; set; }
        public int TotalPoints { get; set; }
        public double AveragePointsPerUser { get; set; }
        
        // New detailed metrics
        public int TotalMeetingsOrganized { get; set; }
        public int TotalRewardsClaimed { get; set; }

        public List<TopUserDto> TopPerformers { get; set; } = new();
        public List<TaskStatusDistributionDto> TaskStatusDistribution { get; set; } = new();
    }

    public class TopUserDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public int Points { get; set; }
        public string ProfilePictureUrl { get; set; } = string.Empty;
        public int CompletedTasks { get; set; }
    }

    public class UserAnalyticsDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public int TotalPoints { get; set; }
        public int TotalProjects { get; set; }
        public int CompletedProjects { get; set; }
        public int TotalTasksAssigned { get; set; }
        public int TasksCompleted { get; set; }
        public double CompletionRate { get; set; }
        
        // New detailed metrics
        public int MeetingsOrganized { get; set; }
        public int MessagesSent { get; set; }
        public int RewardsClaimed { get; set; }

        public List<TaskStatusDistributionDto> TaskStatusDistribution { get; set; } = new();
    }

    // New DTOs for filter dropdowns
    public class DepartmentFilterDto
    {
        public string Name { get; set; } = string.Empty;
    }

    public class UserFilterDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
    }
}
