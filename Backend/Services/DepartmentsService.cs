using Backend.Data;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class DepartmentsService : IDepartmentsService
    {
        private readonly ApplicationDbContext _context;

        public DepartmentsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetDepartmentsAsync()
        {
            var departments = await _context.Departments.AsNoTracking().ToListAsync();
            return departments;
        }

        public async Task<object> GetDepartmentsWithUsersAsync()
        {
            var departments = await _context.Departments.AsNoTracking().ToListAsync();
            
            var users = await _context.Users.AsNoTracking()
                .Include(u => u.Profile)
                .ToListAsync();
                
            var admins = await _context.Admins.AsNoTracking().ToListAsync();

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

            return result;
        }

        public async Task<object> CreateDepartmentAsync(Department model)
        {
            if (string.IsNullOrWhiteSpace(model.Name))
            {
                throw new ArgumentException("Department name is required");
            }

            var exists = await _context.Departments.AnyAsync(d => d.Name.ToLower() == model.Name.ToLower());
            if (exists)
            {
                throw new ArgumentException("Department already exists");
            }

            var newDept = new Department { Name = model.Name };
            _context.Departments.Add(newDept);
            await _context.SaveChangesAsync();

            return newDept;
        }
    }
}
