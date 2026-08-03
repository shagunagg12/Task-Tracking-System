using Backend.Data;
using Backend.DTOs;
using Backend.Hubs;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IHubContext<AdminDashboardHub> _hubContext;

        public AuthService(ApplicationDbContext context, IConfiguration configuration, IHubContext<AdminDashboardHub> hubContext)
        {
            _context = context;
            _configuration = configuration;
            _hubContext = hubContext;
        }

        public async Task<object> RegisterAsync(RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                throw new Exception("Email is already in use.");
            }

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Profile = new UserProfile()
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

            return new { message = "User registered successfully." };
        }

        public async Task<object> LoginAsync(LoginDto dto)
        {
            bool isSuperAdmin = false;
            bool isAdmin = false;
            int userId = 0;
            string userFullName = string.Empty;
            string userEmail = dto.Email;
            string userProfilePictureUrl = string.Empty;
            
            var superAdmin = await _context.SuperAdmins.FirstOrDefaultAsync(s => s.Email == dto.Email);
            
            if (superAdmin == null)
            {
                var checkUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
                if (checkUser != null && !checkUser.IsActive)
                {
                    throw new UnauthorizedAccessException("Your account has been blocked by the administrator.");
                }
            }

            if (superAdmin != null)
            {
                if (!BCrypt.Net.BCrypt.Verify(dto.Password, superAdmin.PasswordHash))
                {
                    await LogFailedLogin(dto.Email);
                    throw new UnauthorizedAccessException("Invalid email or password.");
                }
                
                var userRecord = await _context.Users.FirstOrDefaultAsync(u => u.Email == superAdmin.Email);
                if (userRecord == null)
                {
                    userRecord = new User
                    {
                        FullName = superAdmin.FullName,
                        Email = superAdmin.Email,
                        PasswordHash = superAdmin.PasswordHash,
                        IsActive = true,
                        ProfilePictureUrl = superAdmin.ProfilePictureUrl
                    };
                    _context.Users.Add(userRecord);
                    await _context.SaveChangesAsync();
                }

                isSuperAdmin = true;
                userId = userRecord.Id;
                userFullName = superAdmin.FullName;
                userProfilePictureUrl = superAdmin.ProfilePictureUrl ?? "";
            }
            else
            {
                var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == dto.Email);
                if (admin != null)
                {
                    if (!BCrypt.Net.BCrypt.Verify(dto.Password, admin.PasswordHash))
                    {
                        await LogFailedLogin(dto.Email);
                        throw new UnauthorizedAccessException("Invalid email or password.");
                    }
                    
                    var userRecord = await _context.Users.FirstOrDefaultAsync(u => u.Email == admin.Email);
                    if (userRecord == null)
                    {
                        userRecord = new User
                        {
                            FullName = admin.FullName ?? "Admin",
                            Email = admin.Email,
                            PasswordHash = admin.PasswordHash,
                            IsActive = true,
                            ProfilePictureUrl = admin.ProfilePictureUrl
                        };
                        _context.Users.Add(userRecord);
                        await _context.SaveChangesAsync();
                    }
                    else if (admin.FullName == "Admin" && userRecord.FullName != "Admin")
                    {
                        admin.FullName = userRecord.FullName;
                        await _context.SaveChangesAsync();
                    }
                    
                    isAdmin = true;
                    userId = userRecord.Id;
                    userFullName = admin.FullName ?? "Admin";
                }
                else
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
                    if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                    {
                        await LogFailedLogin(dto.Email);
                        throw new UnauthorizedAccessException("Invalid email or password.");
                    }
                    userId = user.Id;
                    userFullName = user.FullName;
                    userProfilePictureUrl = user.ProfilePictureUrl ?? "";
                }
            }

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
            
            return new
            {
                token = tokenHandler.WriteToken(token),
                user = new { Id = userId, FullName = userFullName, Email = userEmail, isAdmin = (isAdmin || isSuperAdmin), isSuperAdmin = isSuperAdmin, ProfilePictureUrl = userProfilePictureUrl }
            };
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
