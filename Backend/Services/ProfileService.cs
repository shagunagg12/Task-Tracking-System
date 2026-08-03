using Backend.Data;
using Backend.DTOs;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class ProfileService : IProfileService
    {
        private readonly ApplicationDbContext _context;

        public ProfileService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetProfileAsync(ClaimsPrincipal userPrincipal, int userId)
        {
            if (userPrincipal.IsInRole("Admin") || userPrincipal.IsInRole("SuperAdmin"))
            {
                var email = userPrincipal.FindFirstValue(ClaimTypes.Email);
                var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == email);
                if (admin == null) throw new KeyNotFoundException("Admin not found.");

                if (admin.FullName == "Admin")
                {
                    var signupUser = await _context.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Email == admin.Email);
                    if (signupUser != null)
                    {
                        admin.FullName = signupUser.FullName;
                        if (string.IsNullOrEmpty(admin.ProfilePictureUrl)) admin.ProfilePictureUrl = signupUser.ProfilePictureUrl;
                        if (signupUser.Profile != null)
                        {
                            if (string.IsNullOrEmpty(admin.Designation)) admin.Designation = signupUser.Profile.Designation;
                            if (string.IsNullOrEmpty(admin.Department)) admin.Department = signupUser.Profile.Department;
                            if (string.IsNullOrEmpty(admin.Location)) admin.Location = signupUser.Profile.Location;
                            if (string.IsNullOrEmpty(admin.Bio)) admin.Bio = signupUser.Profile.Bio;
                        }
                        await _context.SaveChangesAsync();
                    }
                }

                return new
                {
                    Id = admin.Id,
                    FullName = admin.FullName,
                    admin.Email,
                    ProfilePictureUrl = admin.ProfilePictureUrl,
                    Designation = admin.Designation,
                    Department = admin.Department,
                    Location = admin.Location,
                    Bio = admin.Bio
                };
            }

            var user = await _context.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) throw new KeyNotFoundException("User not found.");

            return new
            {
                Id = user.Id,
                user.FullName,
                user.Email,
                ProfilePictureUrl = user.ProfilePictureUrl ?? "",
                Designation = user.Profile?.Designation ?? "",
                Department = user.Profile?.Department ?? "",
                Location = user.Profile?.Location ?? "",
                Bio = user.Profile?.Bio ?? ""
            };
        }

        public async Task<object> GetDepartmentMembersAsync(ClaimsPrincipal userPrincipal, int userId)
        {
            string userDepartment = "";

            if (userPrincipal.IsInRole("Admin") || userPrincipal.IsInRole("SuperAdmin"))
            {
                var email = userPrincipal.FindFirstValue(ClaimTypes.Email);
                var admin = await _context.Admins.AsNoTracking().FirstOrDefaultAsync(a => a.Email == email);
                if (admin == null) throw new KeyNotFoundException("Admin not found.");
                userDepartment = admin.Department;
            }
            else
            {
                var user = await _context.Users.AsNoTracking().Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null) throw new KeyNotFoundException("User not found.");
                userDepartment = user.Profile?.Department ?? "";
            }

            if (string.IsNullOrEmpty(userDepartment))
            {
                return new List<object>();
            }

            var membersQuery = await _context.Users.AsNoTracking()
                .Include(u => u.Profile)
                .Where(u => u.Profile != null && u.Profile.Department == userDepartment && u.Id != userId)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    Designation = u.Profile != null ? u.Profile.Designation : "",
                    u.ProfilePictureUrl,
                    AdminAvatar = _context.Admins.AsNoTracking().Where(a => a.Email == u.Email).Select(a => a.ProfilePictureUrl).FirstOrDefault()
                })
                .ToListAsync();

            var members = membersQuery.Select(u => new
            {
                u.Id,
                Name = u.FullName,
                Email = u.Email,
                Designation = u.Designation,
                Avatar = !string.IsNullOrEmpty(u.ProfilePictureUrl) 
                    ? u.ProfilePictureUrl 
                    : (!string.IsNullOrEmpty(u.AdminAvatar) 
                        ? u.AdminAvatar 
                        : $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(u.FullName ?? "")}&background=random")
            }).ToList();

            return members;
        }

        public async Task<object> UpdateProfileAsync(ClaimsPrincipal userPrincipal, int userId, UpdateProfileDto dto)
        {
            if (userPrincipal.IsInRole("Admin") || userPrincipal.IsInRole("SuperAdmin"))
            {
                var email = userPrincipal.FindFirstValue(ClaimTypes.Email);
                var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == email);
                if (admin == null) throw new KeyNotFoundException("Admin not found.");

                admin.FullName = dto.FullName;
                admin.Email = dto.Email;
                admin.Designation = dto.Designation;
                admin.Department = dto.Department;
                admin.Location = dto.Location;
                admin.Bio = dto.Bio;
                
                var adminUser = await _context.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Email == admin.Email);
                if (adminUser != null)
                {
                    adminUser.FullName = dto.FullName;
                    adminUser.Email = dto.Email;
                    if (adminUser.Profile == null) adminUser.Profile = new UserProfile();
                    adminUser.Profile.Designation = dto.Designation;
                    adminUser.Profile.Department = dto.Department;
                    adminUser.Profile.Location = dto.Location;
                    adminUser.Profile.Bio = dto.Bio;
                }

                await _context.SaveChangesAsync();
                return new { message = "Admin profile updated successfully!" };
            }

            var user = await _context.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) throw new KeyNotFoundException("User not found.");

            user.FullName = dto.FullName;
            user.Email = dto.Email;

            if (user.Profile == null) 
            {
                user.Profile = new UserProfile();
            }

            user.Profile.Designation = dto.Designation;
            user.Profile.Department = dto.Department;
            user.Profile.Location = dto.Location;
            user.Profile.Bio = dto.Bio;

            await _context.SaveChangesAsync();

            return new { message = "Profile updated successfully!" };
        }

        public async Task<object> UploadProfilePictureAsync(ClaimsPrincipal userPrincipal, int userId, IFormFile file)
        {
            if (file == null || file.Length == 0) throw new ArgumentException("No file uploaded.");

            var cloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");
            var apiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");
            var apiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");

            if (string.IsNullOrEmpty(cloudName) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
            {
                throw new InvalidOperationException("Cloudinary configuration is missing.");
            }

            var account = new CloudinaryDotNet.Account(cloudName, apiKey, apiSecret);
            var cloudinary = new CloudinaryDotNet.Cloudinary(account);

            var uploadParams = new CloudinaryDotNet.Actions.ImageUploadParams()
            {
                File = new CloudinaryDotNet.FileDescription(file.FileName, file.OpenReadStream()),
                Transformation = new CloudinaryDotNet.Transformation().Width(500).Height(500).Crop("fill").Gravity("face")
            };

            var uploadResult = await cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null)
            {
                throw new InvalidOperationException($"Cloudinary upload failed: {uploadResult.Error.Message}");
            }

            if (userPrincipal.IsInRole("Admin") || userPrincipal.IsInRole("SuperAdmin"))
            {
                var email = userPrincipal.FindFirstValue(ClaimTypes.Email);
                var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == email);
                if (admin == null) throw new KeyNotFoundException("Admin not found.");

                admin.ProfilePictureUrl = uploadResult.SecureUrl.ToString();
                await _context.SaveChangesAsync();

                return new { url = admin.ProfilePictureUrl };
            }
            else
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null) throw new KeyNotFoundException("User not found.");

                user.ProfilePictureUrl = uploadResult.SecureUrl.ToString();
                await _context.SaveChangesAsync();

                return new { url = user.ProfilePictureUrl };
            }
        }
    }
}
