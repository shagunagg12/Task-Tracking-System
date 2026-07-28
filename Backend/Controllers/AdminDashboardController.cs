using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminDashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminDashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            // Calculate real numbers from database
            var totalEmployees = await _context.Users.CountAsync();
            
            // Just simulate ActiveToday as a subset of users since we don't have LastLogin
            var activeToday = (int)(totalEmployees * 0.92); // 92% attendance rate simulated

            var runningProjects = await _context.Projects.CountAsync(p => p.Status != "Completed");
            
            // "Completed" or "Done" statuses
            var tasksCompleted = await _context.ProjectTasks
                .CountAsync(t => t.Status == "Completed" || t.Status == "Done");

            var stats = new DashboardStatsDto
            {
                TotalEmployees = totalEmployees,
                ActiveToday = activeToday,
                RunningProjects = runningProjects,
                TasksCompleted = tasksCompleted,
                
                // Return some initial static data for the charts (can be made dynamic later)
                ProductivityTrend = new List<AreaChartData>
                {
                    new AreaChartData { Name = "Jan", Current = 4000, Previous = 2400 },
                    new AreaChartData { Name = "Feb", Current = 3000, Previous = 1398 },
                    new AreaChartData { Name = "Mar", Current = 2000, Previous = 9800 },
                    new AreaChartData { Name = "Apr", Current = 2780, Previous = 3908 },
                    new AreaChartData { Name = "May", Current = 1890, Previous = 4800 },
                    new AreaChartData { Name = "Jun", Current = 2390, Previous = 3800 },
                    new AreaChartData { Name = "Jul", Current = 3490, Previous = 4300 }
                },
                WorkforceDistribution = new List<PieChartData>
                {
                    new PieChartData { Name = "Remote", Value = 40 },
                    new PieChartData { Name = "On-site", Value = 30 },
                    new PieChartData { Name = "Hybrid", Value = 30 }
                },
                DepartmentPerformance = new List<BarChartData>
                {
                    new BarChartData { Name = "Eng", Active = 120, Total = 130 },
                    new BarChartData { Name = "Mktg", Active = 80, Total = 95 },
                    new BarChartData { Name = "Sales", Active = 100, Total = 110 },
                    new BarChartData { Name = "HR", Active = 30, Total = 32 },
                    new BarChartData { Name = "Fin", Active = 40, Total = 45 }
                }
            };

            return Ok(stats);
        }
    }
}
