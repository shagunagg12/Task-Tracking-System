using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

using Backend.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IHubContext<AdminDashboardHub> _hubContext;

        public AuthController(ApplicationDbContext context, IConfiguration configuration, IHubContext<AdminDashboardHub> hubContext)
        {
            _context = context;
            _configuration = configuration;
            _hubContext = hubContext;
        }

        public class RegisterDto
        {
            public string FullName { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        public class LoginDto
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest(new { message = "Email is already in use." });
            }

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Profile = new UserProfile() // Automatically create blank profile
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var notification = new AppNotification
            {
                Title = "New User Registered",
                Message = $"{user.FullName} has registered as a new user.",
                Type = "user",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.AppNotifications.Add(notification);
            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", notification);
            await _hubContext.Clients.All.SendAsync("ReceiveStatsUpdate");

            return Ok(new { message = "User registered successfully." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            bool isSuperAdmin = false;
            bool isAdmin = false;
            int userId = 0;
            string userFullName = string.Empty;
            string userEmail = dto.Email;
            
            string userProfilePictureUrl = string.Empty;
            
            // 0. Check SuperAdmins Table First
            var superAdmin = await _context.SuperAdmins.FirstOrDefaultAsync(s => s.Email == dto.Email);
            if (superAdmin != null)
            {
                if (!BCrypt.Net.BCrypt.Verify(dto.Password, superAdmin.PasswordHash))
                {
                    await LogFailedLogin(dto.Email);
                    return Unauthorized(new { message = "Invalid email or password." });
                }
                
                isSuperAdmin = true;
                userId = superAdmin.Id;
                userFullName = superAdmin.FullName;
                userProfilePictureUrl = superAdmin.ProfilePictureUrl ?? "";
            }
            else
            {
                // 1. Check Admins Table
                var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == dto.Email);
                if (admin != null)
            {
                if (!BCrypt.Net.BCrypt.Verify(dto.Password, admin.PasswordHash))
                {
                    await LogFailedLogin(dto.Email);
                    return Unauthorized(new { message = "Invalid email or password." });
                }
                
                if (admin.FullName == "Admin")
                {
                    var signupUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == admin.Email);
                    if (signupUser != null)
                    {
                        admin.FullName = signupUser.FullName;
                        await _context.SaveChangesAsync();
                    }
                }
                
                isAdmin = true;
                userId = admin.Id;
                userFullName = admin.FullName ?? "Admin";
            }
            else
            {
                // 2. Fallback to normal Users table
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
                if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                {
                    await LogFailedLogin(dto.Email);
                    return Unauthorized(new { message = "Invalid email or password." });
                }
                userId = user.Id;
                userFullName = user.FullName;
                userProfilePictureUrl = user.ProfilePictureUrl ?? "";
            }
            } // Close the outer else block for SuperAdmin

            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "super_secret_fallback_key_that_is_long_enough_12345!";
            var key = Encoding.ASCII.GetBytes(jwtSecret);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Email, userEmail),
                new Claim(ClaimTypes.Name, userFullName)
            };

            if (isSuperAdmin)
            {
                claims.Add(new Claim(ClaimTypes.Role, "SuperAdmin"));
                // SuperAdmins also get Admin privileges
                claims.Add(new Claim(ClaimTypes.Role, "Admin"));
            }
            else if (isAdmin)
            {
                claims.Add(new Claim(ClaimTypes.Role, "Admin"));
            }

            claims.Add(new Claim("ProfilePictureUrl", userProfilePictureUrl));

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            
            return Ok(new
            {
                token = tokenHandler.WriteToken(token),
                user = new { Id = userId, FullName = userFullName, Email = userEmail, isAdmin = (isAdmin || isSuperAdmin), isSuperAdmin = isSuperAdmin, ProfilePictureUrl = userProfilePictureUrl }
            });
        }

        private async Task LogFailedLogin(string email)
        {
            var notification = new AppNotification
            {
                Title = "Failed Login Attempt",
                Message = $"Failed login attempt detected for email {email}.",
                Type = "warning",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.AppNotifications.Add(notification);
            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", notification);
        }
    }
}
