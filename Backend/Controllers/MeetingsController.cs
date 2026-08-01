using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Interfaces;
using System;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class MeetingsController : ControllerBase
    {
        private readonly IMeetingsService _meetingsService;

        public MeetingsController(IMeetingsService meetingsService)
        {
            _meetingsService = meetingsService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateMeeting([FromBody] MeetingRequestDto request)
        {
            try
            {
                var result = await _meetingsService.CreateMeetingAsync(User, request);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("Master Google Account token has expired"))
                {
                    return StatusCode(500, new { message = "The Master Google Account token has expired or was revoked.", error = ex.Message });
                }
                return StatusCode(500, new { message = "An error occurred while creating the meeting.", error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetMeetings()
        {
            try
            {
                var result = await _meetingsService.GetMeetingsAsync(User);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching meetings.", error = ex.Message });
            }
        }
    }
}
