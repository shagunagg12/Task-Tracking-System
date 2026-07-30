using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Backend.Hubs;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentNotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<AdminDashboardHub> _hubContext;

        public DepartmentNotificationsController(ApplicationDbContext context, IHubContext<AdminDashboardHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public class NotifyRequest
        {
            public string Title { get; set; } = string.Empty;
            public string Message { get; set; } = string.Empty;
        }

        [HttpPost("{departmentName}/notify")]
        public async Task<IActionResult> NotifyDepartment(string departmentName, [FromBody] NotifyRequest request)
        {
            var announcement = new DepartmentAnnouncement
            {
                DepartmentName = departmentName,
                Title = request.Title,
                Message = request.Message
            };
            
            _context.DepartmentAnnouncements.Add(announcement);
            await _context.SaveChangesAsync();

            // Broadcast to the whole hub
            // The frontend will filter if the notification belongs to the current user
            await _hubContext.Clients.All.SendAsync("ReceiveUserNotification", new { 
                Id = announcement.Id,
                Department = departmentName, 
                Title = request.Title, 
                Message = request.Message,
                CreatedAt = announcement.CreatedAt
            });

            return Ok(announcement);
        }

        [HttpGet("{departmentName}")]
        public async Task<IActionResult> GetDepartmentAnnouncements(string departmentName)
        {
            var announcements = await _context.DepartmentAnnouncements
                .Where(a => a.DepartmentName == departmentName)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
            
            return Ok(announcements);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAnnouncement(int id, [FromBody] NotifyRequest request)
        {
            var announcement = await _context.DepartmentAnnouncements.FindAsync(id);
            if (announcement == null) return NotFound();

            announcement.Title = request.Title;
            announcement.Message = request.Message;

            await _context.SaveChangesAsync();
            return Ok(announcement);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAnnouncement(int id)
        {
            var announcement = await _context.DepartmentAnnouncements.FindAsync(id);
            if (announcement == null) return NotFound();

            _context.DepartmentAnnouncements.Remove(announcement);
            await _context.SaveChangesAsync();

            return Ok();
        }

        // Keep this for backwards compatibility for users hitting the old endpoint if needed
        // but now it fetches DepartmentAnnouncements instead based on user's department
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserNotifications(int userId)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (profile == null || string.IsNullOrEmpty(profile.Department)) 
            {
                return Ok(new object[] { });
            }

            var announcements = await _context.DepartmentAnnouncements
                .Where(a => a.DepartmentName == profile.Department)
                .OrderByDescending(a => a.CreatedAt)
                .Take(20)
                .ToListAsync();
            
            return Ok(announcements);
        }
    }
}
