using Backend.Data;
using Backend.Models;
using Backend.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class MeetingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<AdminDashboardHub> _hubContext;

        public MeetingsController(ApplicationDbContext context, IHubContext<AdminDashboardHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetMeetings()
        {
            var meetings = await _context.Meetings.ToListAsync();
            return Ok(meetings);
        }

        [HttpPost]
        public async Task<IActionResult> ScheduleMeeting([FromBody] Meeting meeting)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            meeting.OrganizerId = userId;
            _context.Meetings.Add(meeting);
            await _context.SaveChangesAsync();

            var userName = User.FindFirstValue(ClaimTypes.Name) ?? "A user";
            
            // Create the real-time notification with the foreign key!
            var notification = new AppNotification
            {
                Title = "Meeting Scheduled",
                Message = $"{userName} scheduled a new meeting: '{meeting.Title}'",
                Type = "meeting_scheduled",
                CreatedAt = DateTime.UtcNow,
                IsRead = false,
                MeetingId = meeting.Id // Here is the new Foreign Key link!
            };

            _context.AppNotifications.Add(notification);
            await _context.SaveChangesAsync();

            // Broadcast instantly to Admin Dashboard
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", notification);

            return Ok(new { message = "Meeting scheduled successfully", meeting });
        }
    }
}
