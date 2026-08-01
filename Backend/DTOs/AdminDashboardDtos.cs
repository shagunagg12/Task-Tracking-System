using System.Collections.Generic;

namespace Backend.DTOs
{
    public class AreaChartData
    {
        public string Name { get; set; } = string.Empty;
        public int Current { get; set; }
        public int Previous { get; set; }
    }

    public class BarChartData
    {
        public string Name { get; set; } = string.Empty;
        public int Total { get; set; }
        public int Active { get; set; }
    }

    public class PieChartData
    {
        public string Name { get; set; } = string.Empty;
        public int Value { get; set; }
    }

    public class RecentOnboardingDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class DashboardStatsDto
    {
        public int TotalEmployees { get; set; }
        public int ActiveToday { get; set; }
        public int RunningProjects { get; set; }
        public int TasksCompleted { get; set; }
        
        public List<AreaChartData> ProductivityTrend { get; set; } = new List<AreaChartData>();
        public List<PieChartData> WorkforceDistribution { get; set; } = new List<PieChartData>();
        public List<BarChartData> DepartmentPerformance { get; set; } = new List<BarChartData>();
        public List<RecentOnboardingDto> RecentOnboarding { get; set; } = new List<RecentOnboardingDto>();
    }
}
