using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Interfaces;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentNotificationsController : ControllerBase
    {
        private readonly IDepartmentNotificationsService _notificationsService;

        public DepartmentNotificationsController(IDepartmentNotificationsService notificationsService)
        {
            _notificationsService = notificationsService;
        }

        [HttpPost("{departmentName}/notify")]
        public async Task<IActionResult> NotifyDepartment(string departmentName, [FromBody] NotifyRequest request)
        {
            var result = await _notificationsService.NotifyDepartmentAsync(departmentName, request);
            return Ok(result);
        }

        [HttpGet("{departmentName}")]
        public async Task<IActionResult> GetDepartmentAnnouncements(string departmentName)
        {
            var result = await _notificationsService.GetDepartmentAnnouncementsAsync(departmentName);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAnnouncement(int id, [FromBody] NotifyRequest request)
        {
            try
            {
                var result = await _notificationsService.UpdateAnnouncementAsync(id, request);
                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAnnouncement(int id)
        {
            try
            {
                await _notificationsService.DeleteAnnouncementAsync(id);
                return Ok();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserNotifications(int userId)
        {
            var result = await _notificationsService.GetUserNotificationsAsync(userId);
            return Ok(result);
        }
    }
}
