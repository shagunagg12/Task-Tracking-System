using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class StandingsController : ControllerBase
    {
        private readonly IStandingsService _standingsService;

        public StandingsController(IStandingsService standingsService)
        {
            _standingsService = standingsService;
        }

        [HttpGet("social")]
        public async Task<IActionResult> GetSocialStandings([FromQuery] string timeframe = "all")
        {
            var result = await _standingsService.GetSocialStandingsAsync(timeframe);
            return Ok(result);
        }

        [HttpGet("efficiency")]
        public async Task<IActionResult> GetEfficiencyStandings()
        {
            var result = await _standingsService.GetEfficiencyStandingsAsync();
            return Ok(result);
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMySocialDashboard()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized();
            }

            try
            {
                var result = await _standingsService.GetMySocialDashboardAsync(currentUserId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
