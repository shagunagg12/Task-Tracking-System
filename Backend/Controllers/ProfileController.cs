using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System.Security.Claims;

namespace Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProfileController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProfileController(ApplicationDbContext context)
        {
            _context = context;
        }

        public class UpdateProfileDto
        {
            public string FullName { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Designation { get; set; } = string.Empty;
            public string Department { get; set; } = string.Empty;
            public string Location { get; set; } = string.Empty;
            public string Bio { get; set; } = string.Empty;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            if (User.IsInRole("Admin"))
            {
                var admin = await _context.Admins.FindAsync(userId);
                if (admin == null) return NotFound("Admin not found.");

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

                return Ok(new
                {
                    FullName = admin.FullName,
                    admin.Email,
                    ProfilePictureUrl = admin.ProfilePictureUrl,
                    Designation = admin.Designation,
                    Department = admin.Department,
                    Location = admin.Location,
                    Bio = admin.Bio
                });
            }

            var user = await _context.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound("User not found.");

            return Ok(new
            {
                user.FullName,
                user.Email,
                ProfilePictureUrl = user.ProfilePictureUrl ?? "",
                Designation = user.Profile?.Designation ?? "",
                Department = user.Profile?.Department ?? "",
                Location = user.Profile?.Location ?? "",
                Bio = user.Profile?.Bio ?? ""
            });
        }

        [HttpGet("department-members")]
        public async Task<IActionResult> GetDepartmentMembers()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            string userDepartment = "";

            if (User.IsInRole("Admin"))
            {
                var admin = await _context.Admins.FindAsync(userId);
                if (admin == null) return NotFound();
                userDepartment = admin.Department;
            }
            else
            {
                var user = await _context.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null) return NotFound();
                userDepartment = user.Profile?.Department ?? "";
            }

            if (string.IsNullOrEmpty(userDepartment))
            {
                return Ok(new List<object>());
            }

            var members = await _context.Users
                .Include(u => u.Profile)
                .Where(u => u.Profile != null && u.Profile.Department == userDepartment && u.Id != userId)
                .Select(u => new
                {
                    u.Id,
                    Name = u.FullName,
                    Email = u.Email,
                    Designation = u.Profile != null ? u.Profile.Designation : "",
                    Avatar = !string.IsNullOrEmpty(u.ProfilePictureUrl) ? u.ProfilePictureUrl : (!string.IsNullOrEmpty(_context.Admins.Where(a => a.Email == u.Email).Select(a => a.ProfilePictureUrl).FirstOrDefault()) ? _context.Admins.Where(a => a.Email == u.Email).Select(a => a.ProfilePictureUrl).FirstOrDefault() : $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(u.FullName)}&background=random")
                })
                .ToListAsync();

            return Ok(members);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile(UpdateProfileDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            if (User.IsInRole("Admin"))
            {
                var admin = await _context.Admins.FindAsync(userId);
                if (admin == null) return NotFound("Admin not found.");

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
                return Ok(new { message = "Admin profile updated successfully!" });
            }

            var user = await _context.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound("User not found.");

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

            return Ok(new { message = "Profile updated successfully!" });
        }
        [HttpPost("picture")]
        public async Task<IActionResult> UploadProfilePicture(IFormFile file)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

            var cloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");
            var apiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");
            var apiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");

            if (string.IsNullOrEmpty(cloudName) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
            {
                return StatusCode(500, "Cloudinary configuration is missing.");
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
                return StatusCode(500, $"Cloudinary upload failed: {uploadResult.Error.Message}");
            }

            if (User.IsInRole("Admin"))
            {
                var admin = await _context.Admins.FindAsync(userId);
                if (admin == null) return NotFound("Admin not found.");

                admin.ProfilePictureUrl = uploadResult.SecureUrl.ToString();
                await _context.SaveChangesAsync();

                return Ok(new { url = admin.ProfilePictureUrl });
            }
            else
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null) return NotFound("User not found.");

                user.ProfilePictureUrl = uploadResult.SecureUrl.ToString();
                await _context.SaveChangesAsync();

                return Ok(new { url = user.ProfilePictureUrl });
            }
        }
    }
}
