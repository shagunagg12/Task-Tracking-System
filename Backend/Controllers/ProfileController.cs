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

        [HttpPut]
        public async Task<IActionResult> UpdateProfile(UpdateProfileDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
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

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found.");

            user.ProfilePictureUrl = uploadResult.SecureUrl.ToString();
            await _context.SaveChangesAsync();

            return Ok(new { url = user.ProfilePictureUrl });
        }
    }
}
