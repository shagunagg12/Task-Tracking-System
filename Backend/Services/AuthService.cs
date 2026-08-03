using Backend.Data;
using Backend.DTOs;
using Backend.Hubs;
using Backend.Interfaces;
using Backend.Models;
using Google.Apis.Auth;
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
using System.Net.Http;
using System.Text.Json;

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

        public async Task<object> GoogleLoginAsync(GoogleLoginDto dto)
        {
            string userEmail = "";
            string userFullName = "";
            string userProfilePictureUrl = "";

            try
            {
                // Try validating as JWT (ID Token) first
                var settings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { "380754775994-nvj1bh4qqarii4ulbpisrnit8orisi2t.apps.googleusercontent.com" }
                };
                var payload = await GoogleJsonWebSignature.ValidateAsync(dto.Token, settings);
                userEmail = payload.Email;
                userFullName = payload.Name ?? "Google User";
                userProfilePictureUrl = payload.Picture ?? "";
            }
            catch (Exception)
            {
                // If it fails, assume it's an Access Token and fetch user info
                try
                {
                    using var client = new HttpClient();
                    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", dto.Token);
                    var response = await client.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");
                    
                    if (!response.IsSuccessStatusCode)
                    {
                        throw new UnauthorizedAccessException("Invalid Google token.");
                    }
                    
                    var json = await response.Content.ReadAsStringAsync();
                    using var document = System.Text.Json.JsonDocument.Parse(json);
                    var root = document.RootElement;
                    
                    userEmail = root.GetProperty("email").GetString();
                    userFullName = root.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : "Google User";
                    userProfilePictureUrl = root.TryGetProperty("picture", out var picProp) ? picProp.GetString() : "";
                }
                catch (Exception ex)
                {
                    throw new UnauthorizedAccessException($"Invalid Google token. {ex.Message}");
                }
            }
            
            bool isSuperAdmin = false;
            bool isAdmin = false;
            int userId = 0;

            var superAdmin = await _context.SuperAdmins.FirstOrDefaultAsync(s => s.Email == userEmail);
            
            if (superAdmin == null)
            {
                var checkUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
                if (checkUser != null && !checkUser.IsActive)
                {
                    throw new UnauthorizedAccessException("Your account has been blocked by the administrator.");
                }
            }

            if (superAdmin != null)
            {
                var userRecord = await _context.Users.FirstOrDefaultAsync(u => u.Email == superAdmin.Email);
                if (userRecord == null)
                {
                    userRecord = new User
                    {
                        FullName = superAdmin.FullName,
                        Email = superAdmin.Email,
                        PasswordHash = superAdmin.PasswordHash, // Use existing hash
                        IsActive = true,
                        ProfilePictureUrl = userProfilePictureUrl // Update picture from google
                    };
                    _context.Users.Add(userRecord);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    userRecord.ProfilePictureUrl = userProfilePictureUrl;
                    await _context.SaveChangesAsync();
                }

                isSuperAdmin = true;
                userId = userRecord.Id;
                userFullName = superAdmin.FullName;
            }
            else
            {
                var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == userEmail);
                if (admin != null)
                {
                    var userRecord = await _context.Users.FirstOrDefaultAsync(u => u.Email == admin.Email);
                    if (userRecord == null)
                    {
                        userRecord = new User
                        {
                            FullName = admin.FullName ?? userFullName,
                            Email = admin.Email,
                            PasswordHash = admin.PasswordHash,
                            IsActive = true,
                            ProfilePictureUrl = userProfilePictureUrl
                        };
                        _context.Users.Add(userRecord);
                        await _context.SaveChangesAsync();
                    }
                    else
                    {
                        if (admin.FullName == "Admin" && userRecord.FullName != "Admin")
                        {
                            admin.FullName = userRecord.FullName;
                        }
                        userRecord.ProfilePictureUrl = userProfilePictureUrl;
                        await _context.SaveChangesAsync();
                    }
                    
                    isAdmin = true;
                    userId = userRecord.Id;
                    userFullName = admin.FullName ?? userFullName;
                }
                else
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
                    if (user == null)
                    {
                        if (!dto.IsRegistering)
                        {
                            throw new UnauthorizedAccessException("Account not found. Please sign up first.");
                        }
                        
                        // Create a new user automatically since Google verified them
                        user = new User
                        {
                            FullName = userFullName,
                            Email = userEmail,
                            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), // random password
                            IsActive = true,
                            ProfilePictureUrl = userProfilePictureUrl,
                            Profile = new UserProfile()
                        };
                        _context.Users.Add(user);
                        await _context.SaveChangesAsync();
                        
                        var notification = new AppNotification
                        {
                            Title = "New User Registered via Google",
                            Message = $"{user.FullName} has registered as a new user via Google.",
                            Type = "user",
                            CreatedAt = DateTime.UtcNow,
                            IsRead = false
                        };
                        _context.AppNotifications.Add(notification);
                        await _context.SaveChangesAsync();
                        await _hubContext.Clients.All.SendAsync("ReceiveNotification", notification);
                        await _hubContext.Clients.All.SendAsync("ReceiveStatsUpdate");
                    }
                    else
                    {
                        user.ProfilePictureUrl = userProfilePictureUrl;
                        await _context.SaveChangesAsync();
                    }
                    
                    userId = user.Id;
                    userFullName = user.FullName;
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

        public async Task<object> GithubLoginAsync(GithubLoginDto dto)
        {
            var clientId = "Ov23li3e1HH72JlSYEuv";
            var clientSecret = "5420191e8ceee81a783c3362917ea08c39cc87ad";
            
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
            
            var tokenRequest = new Dictionary<string, string>
            {
                { "client_id", clientId },
                { "client_secret", clientSecret },
                { "code", dto.Code }
            };
            
            var tokenResponse = await client.PostAsync("https://github.com/login/oauth/access_token", new FormUrlEncodedContent(tokenRequest));
            if (!tokenResponse.IsSuccessStatusCode)
                throw new UnauthorizedAccessException("Failed to exchange github code.");
                
            var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
            using var tokenDoc = JsonDocument.Parse(tokenJson);
            
            if (!tokenDoc.RootElement.TryGetProperty("access_token", out var accessTokenProp))
                throw new UnauthorizedAccessException("Invalid GitHub authorization code.");
                
            var accessToken = accessTokenProp.GetString();
            
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            client.DefaultRequestHeaders.UserAgent.Add(new System.Net.Http.Headers.ProductInfoHeaderValue("MattsApp", "1.0"));
            
            var userResponse = await client.GetAsync("https://api.github.com/user");
            if (!userResponse.IsSuccessStatusCode)
                throw new UnauthorizedAccessException("Failed to fetch github user profile.");
                
            var userJson = await userResponse.Content.ReadAsStringAsync();
            using var userDoc = JsonDocument.Parse(userJson);
            
            var userFullName = userDoc.RootElement.TryGetProperty("name", out var nameProp) && nameProp.ValueKind != JsonValueKind.Null ? nameProp.GetString() : "GitHub User";
            var userProfilePictureUrl = userDoc.RootElement.TryGetProperty("avatar_url", out var avatarProp) ? avatarProp.GetString() : "";
            
            var emailResponse = await client.GetAsync("https://api.github.com/user/emails");
            if (!emailResponse.IsSuccessStatusCode)
                throw new UnauthorizedAccessException("Failed to fetch github emails.");
                
            var emailJson = await emailResponse.Content.ReadAsStringAsync();
            using var emailDoc = JsonDocument.Parse(emailJson);
            
            string userEmail = "";
            foreach (var emailElem in emailDoc.RootElement.EnumerateArray())
            {
                if (emailElem.GetProperty("primary").GetBoolean())
                {
                    userEmail = emailElem.GetProperty("email").GetString();
                    break;
                }
            }
            
            if (string.IsNullOrEmpty(userEmail))
                throw new UnauthorizedAccessException("No primary email found on GitHub account.");

            bool isSuperAdmin = false;
            bool isAdmin = false;
            int userId = 0;

            var superAdmin = await _context.SuperAdmins.FirstOrDefaultAsync(s => s.Email == userEmail);
            
            if (superAdmin == null)
            {
                var checkUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
                if (checkUser != null && !checkUser.IsActive)
                {
                    throw new UnauthorizedAccessException("Your account has been blocked by the administrator.");
                }
            }

            if (superAdmin != null)
            {
                var userRecord = await _context.Users.FirstOrDefaultAsync(u => u.Email == superAdmin.Email);
                if (userRecord == null)
                {
                    userRecord = new User
                    {
                        FullName = superAdmin.FullName,
                        Email = superAdmin.Email,
                        PasswordHash = superAdmin.PasswordHash,
                        IsActive = true,
                        ProfilePictureUrl = userProfilePictureUrl
                    };
                    _context.Users.Add(userRecord);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    if (string.IsNullOrEmpty(userRecord.ProfilePictureUrl) || userRecord.ProfilePictureUrl.Contains("ui-avatars"))
                    {
                        userRecord.ProfilePictureUrl = userProfilePictureUrl;
                        await _context.SaveChangesAsync();
                    }
                }

                userId = userRecord.Id;
                userFullName = userRecord.FullName;
                isSuperAdmin = true;
                isAdmin = true;
            }
            else
            {
                var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == userEmail);
                if (admin != null)
                {
                    var userRecord = await _context.Users.FirstOrDefaultAsync(u => u.Email == admin.Email);
                    if (userRecord == null)
                    {
                        userRecord = new User
                        {
                            FullName = admin.FullName,
                            Email = admin.Email,
                            PasswordHash = admin.PasswordHash,
                            IsActive = true,
                            ProfilePictureUrl = userProfilePictureUrl
                        };
                        _context.Users.Add(userRecord);
                        await _context.SaveChangesAsync();
                    }
                    else
                    {
                        if (string.IsNullOrEmpty(userRecord.ProfilePictureUrl) || userRecord.ProfilePictureUrl.Contains("ui-avatars"))
                        {
                            userRecord.ProfilePictureUrl = userProfilePictureUrl;
                            await _context.SaveChangesAsync();
                        }
                    }

                    userId = userRecord.Id;
                    userFullName = userRecord.FullName;
                    isAdmin = true;
                }
                else
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
                    if (user == null)
                    {
                        if (!dto.IsRegistering)
                        {
                            throw new UnauthorizedAccessException("Account not found. Please sign up first.");
                        }
                        
                        user = new User
                        {
                            FullName = userFullName,
                            Email = userEmail,
                            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                            IsActive = true,
                            ProfilePictureUrl = userProfilePictureUrl
                        };
                        _context.Users.Add(user);
                        await _context.SaveChangesAsync();
                    }
                    else
                    {
                        if (string.IsNullOrEmpty(user.ProfilePictureUrl) || user.ProfilePictureUrl.Contains("ui-avatars"))
                        {
                            user.ProfilePictureUrl = userProfilePictureUrl;
                            await _context.SaveChangesAsync();
                        }
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
