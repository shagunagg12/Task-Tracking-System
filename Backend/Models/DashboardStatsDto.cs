namespace Backend.Models
{
    public class DashboardStatsDto
    {
        public int TotalEmployees { get; set; }
        public int ActiveToday { get; set; }
        public int RunningProjects { get; set; }
        public int TasksCompleted { get; set; }
        
        // Arrays for charts (we'll keep some dummy data here if needed, or send real data later)
        public List<AreaChartData> ProductivityTrend { get; set; } = new List<AreaChartData>();
        public List<PieChartData> WorkforceDistribution { get; set; } = new List<PieChartData>();
        public List<BarChartData> DepartmentPerformance { get; set; } = new List<BarChartData>();
        public List<RecentOnboardingDto> RecentOnboarding { get; set; } = new List<RecentOnboardingDto>();
    }

    public class RecentOnboardingDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class AreaChartData
    {
        public string Name { get; set; } = string.Empty;
        public int Current { get; set; }
        public int Previous { get; set; }
    }

    public class PieChartData
    {
        public string Name { get; set; } = string.Empty;
        public int Value { get; set; }
    }

    public class BarChartData
    {
        public string Name { get; set; } = string.Empty;
        public int Active { get; set; }
        public int Total { get; set; }
    }
}
