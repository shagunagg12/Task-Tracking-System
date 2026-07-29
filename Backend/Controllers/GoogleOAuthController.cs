using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using System.Security.Claims;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Calendar.v3;
using Google.Apis.Auth.OAuth2.Responses;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/auth/google")]
    public class GoogleOAuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly string _clientId;
        private readonly string _clientSecret;
        private readonly string _redirectUri = "http://localhost:5024/api/auth/google-callback";

        public GoogleOAuthController(ApplicationDbContext context)
        {
            _context = context;
            _clientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID") ?? "";
            _clientSecret = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET") ?? "";
        }

        [Authorize]
        [HttpGet("login")]
        public IActionResult Login()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new ClientSecrets
                {
                    ClientId = _clientId,
                    ClientSecret = _clientSecret
                },
                Scopes = new[] { CalendarService.Scope.CalendarEvents }
            });

            var requestUrl = flow.CreateAuthorizationCodeRequest(_redirectUri);
            requestUrl.State = userId;

            // access_type=offline is added automatically by the .NET SDK
            var url = requestUrl.Build().ToString() + "&prompt=consent";

            return Ok(new { url = url });
        }

        [Authorize]
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            // Since we are using a global master account for Google Meet,
            // we just need to check if the master account is connected.
            var masterUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "matts.meet@gmail.com");
            bool isConnected = masterUser != null && !string.IsNullOrEmpty(masterUser.GoogleRefreshToken);
            return Ok(new { isConnected });
        }

        [HttpGet("/api/auth/google-callback")]
        public async Task<IActionResult> Callback([FromQuery] string code, [FromQuery] string state)
        {
            if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(state))
            {
                return BadRequest("Invalid callback parameters.");
            }

            if (!int.TryParse(state, out int userId))
            {
                return BadRequest("Invalid state parameter.");
            }

            var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new ClientSecrets
                {
                    ClientId = _clientId,
                    ClientSecret = _clientSecret
                }
            });

            try
            {
                var token = await flow.ExchangeCodeForTokenAsync(userId.ToString(), code, _redirectUri, System.Threading.CancellationToken.None);

                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.GoogleAccessToken = token.AccessToken;
                    if (!string.IsNullOrEmpty(token.RefreshToken))
                    {
                        user.GoogleRefreshToken = token.RefreshToken;
                    }
                    await _context.SaveChangesAsync();
                }

                // Redirect back to frontend
                return Redirect("http://localhost:5173/dashboard/calendar?google_connected=true");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] ClientId length: {_clientId?.Length}, Secret length: {_clientSecret?.Length}");
                Console.WriteLine($"[DEBUG] ClientId: '{_clientId}'");
                Console.WriteLine($"[DEBUG] Secret: '{_clientSecret}'");
                return StatusCode(500, $"Error authenticating with Google: {ex.Message}");
            }
        }
    }
}
