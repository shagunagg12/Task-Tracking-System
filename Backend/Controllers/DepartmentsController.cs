using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Linq;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DepartmentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetDepartments()
        {
            var departments = await _context.Departments.ToListAsync();
            return Ok(departments);
        }

        [HttpGet("with-users")]
        public async Task<IActionResult> GetDepartmentsWithUsers()
        {
            var departments = await _context.Departments.ToListAsync();
            
            var users = await _context.Users
                .Include(u => u.Profile)
                .ToListAsync();
                
            var admins = await _context.Admins.ToListAsync();

            var result = departments.Select(d => new
            {
                Id = d.Id,
                Name = d.Name,
                Users = users.Where(u => u.Profile != null && string.Equals(u.Profile.Department, d.Name, StringComparison.OrdinalIgnoreCase))
                    .Select(u => 
                    {
                        var adminAvatar = admins.FirstOrDefault(a => a.Email == u.Email)?.ProfilePictureUrl;
                        return new 
                        {
                            Id = u.Id,
                            Name = u.FullName,
                            Email = u.Email,
                            Designation = u.Profile?.Designation,
                            Avatar = !string.IsNullOrEmpty(u.ProfilePictureUrl) 
                                ? u.ProfilePictureUrl 
                                : (!string.IsNullOrEmpty(adminAvatar)
                                    ? adminAvatar
                                    : $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(u.FullName ?? "")}&background=random")
                        };
                    }).ToList()
            }).ToList();

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateDepartment([FromBody] Department model)
        {
            if (string.IsNullOrWhiteSpace(model.Name))
            {
                return BadRequest(new { message = "Department name is required" });
            }

            var exists = await _context.Departments.AnyAsync(d => d.Name.ToLower() == model.Name.ToLower());
            if (exists)
            {
                return BadRequest(new { message = "Department already exists" });
            }

            var newDept = new Department { Name = model.Name };
            _context.Departments.Add(newDept);
            await _context.SaveChangesAsync();

            return Ok(newDept);
        }
    }
}
