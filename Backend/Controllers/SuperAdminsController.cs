using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public class SuperAdminsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SuperAdminsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSuperAdmins()
        {
            var superAdmins = await _context.SuperAdmins
                .Select(sa => new
                {
                    sa.Id,
                    sa.Email,
                    sa.FullName,
                    sa.ProfilePictureUrl
                })
                .ToListAsync();

            return Ok(superAdmins);
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterSuperAdmin([FromBody] RegisterSuperAdminDto dto)
        {
            if (await _context.SuperAdmins.AnyAsync(sa => sa.Email == dto.Email))
            {
                return BadRequest(new { message = "Email is already registered as a Super Admin." });
            }

            var newSuperAdmin = new SuperAdmin
            {
                Email = dto.Email,
                FullName = dto.FullName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };

            _context.SuperAdmins.Add(newSuperAdmin);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Super Admin registered successfully." });
        }
    }

    public class RegisterSuperAdminDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
    }
}
