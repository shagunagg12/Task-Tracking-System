using Backend.Data;
using Backend.Interfaces;
using Backend.Models;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Calendar.v3;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class GoogleOAuthService : IGoogleOAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly HttpClient _httpClient;
        private readonly AppSettings _appSettings;
        private readonly string _redirectUri;
        private readonly string _clientId;
        private readonly string _clientSecret;

        public GoogleOAuthService(ApplicationDbContext context, IOptions<AppSettings> appSettings)
        {
            _context = context;
            _httpClient = new HttpClient();
            _appSettings = appSettings.Value;
            _redirectUri = $"{_appSettings.BackendUrl}/api/auth/google-callback";
            _clientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID") ?? "";
            _clientSecret = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET") ?? "";
        }

        public string GetLoginUrl(ClaimsPrincipal user)
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthorizedAccessException();
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

            return requestUrl.Build().ToString() + "&prompt=consent";
        }

        public async Task<bool> GetStatusAsync()
        {
            var masterUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => !string.IsNullOrEmpty(u.GoogleRefreshToken));
            return masterUser != null;
        }

        public async Task CallbackAsync(string code, string state)
        {
            if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(state))
            {
                throw new ArgumentException("Invalid callback parameters.");
            }

            if (!int.TryParse(state, out int userId))
            {
                throw new ArgumentException("Invalid state parameter.");
            }

            var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new ClientSecrets
                {
                    ClientId = _clientId,
                    ClientSecret = _clientSecret
                }
            });

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
        }
    }
}
