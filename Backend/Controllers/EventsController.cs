using Backend.DTOs;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly IEventsService _eventsService;
        private readonly AppSettings _appSettings;

        public EventsController(IEventsService eventsService, IOptions<AppSettings> appSettings)
        {
            _eventsService = eventsService;
            _appSettings = appSettings.Value;
        }

        [HttpGet]
        public async Task<IActionResult> GetEvents()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized();
            }

            var result = await _eventsService.GetEventsAsync(currentUserId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateEvent([FromBody] CreateEventRequest request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized();
            }

            var result = await _eventsService.CreateEventAsync(currentUserId, request);
            return Ok(result);
        }

        [HttpPost("{id}/rsvp")]
        public async Task<IActionResult> RsvpEvent(int id, [FromBody] RsvpRequest request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized();
            }

            try
            {
                var result = await _eventsService.RsvpEventAsync(currentUserId, id, request);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [AllowAnonymous]
        [HttpGet("{id}/rsvp-email")]
        public async Task<IActionResult> RsvpViaEmail(int id, [FromQuery] int userId, [FromQuery] string status, [FromQuery] string signature)
        {
            var isValid = await _eventsService.RsvpViaEmailAsync(id, userId, status, signature);
            if (!isValid)
            {
                return BadRequest("Invalid or expired RSVP link.");
            }
            
            return Redirect($"{_appSettings.FrontendUrl}/dashboard");
        }
    }
}
