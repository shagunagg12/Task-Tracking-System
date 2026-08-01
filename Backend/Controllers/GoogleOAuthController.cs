using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.Extensions.Options;
using System.Threading.Tasks;
using System;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/auth/google")]
    public class GoogleOAuthController : ControllerBase
    {
        private readonly IGoogleOAuthService _googleOAuthService;
        private readonly AppSettings _appSettings;

        public GoogleOAuthController(IGoogleOAuthService googleOAuthService, IOptions<AppSettings> appSettings)
        {
            _googleOAuthService = googleOAuthService;
            _appSettings = appSettings.Value;
        }

        [Authorize]
        [HttpGet("login")]
        public IActionResult Login()
        {
            try
            {
                var url = _googleOAuthService.GetLoginUrl(User);
                return Ok(new { url });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
        }

        [Authorize]
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var isConnected = await _googleOAuthService.GetStatusAsync();
            return Ok(new { isConnected });
        }

        [HttpGet("/api/auth/google-callback")]
        public async Task<IActionResult> Callback([FromQuery] string code, [FromQuery] string state)
        {
            try
            {
                await _googleOAuthService.CallbackAsync(code, state);
                return Redirect($"{_appSettings.FrontendUrl}/dashboard/calendar?google_connected=true");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error authenticating with Google: {ex.Message}");
            }
        }
    }
}
