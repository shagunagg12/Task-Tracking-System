using Microsoft.AspNetCore.Mvc;
using Backend.Interfaces;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminDashboardController : ControllerBase
    {
        private readonly IAdminDashboardService _adminDashboardService;

        public AdminDashboardController(IAdminDashboardService adminDashboardService)
        {
            _adminDashboardService = adminDashboardService;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var stats = await _adminDashboardService.GetDashboardStatsAsync();
            return Ok(stats);
        }

        [HttpGet("notifications")]
        public async Task<IActionResult> GetNotifications()
        {
            var notifications = await _adminDashboardService.GetNotificationsAsync();
            return Ok(notifications);
        }

        [HttpPatch("notifications/{id}/read")]
        public async Task<IActionResult> MarkNotificationAsRead(int id)
        {
            var success = await _adminDashboardService.MarkNotificationAsReadAsync(id);
            if (!success) return NotFound();
            return Ok();
        }

        [HttpPost("notifications/read-all")]
        public async Task<IActionResult> MarkAllNotificationsAsRead()
        {
            await _adminDashboardService.MarkAllNotificationsAsReadAsync();
            return Ok();
        }

        [HttpDelete("notifications/{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var success = await _adminDashboardService.DeleteNotificationAsync(id);
            if (!success) return NotFound();
            return Ok();
        }
    }
}
