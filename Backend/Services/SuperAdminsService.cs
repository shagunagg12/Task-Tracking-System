using Backend.Data;
using Backend.DTOs;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class SuperAdminsService : ISuperAdminsService
    {
        private readonly ApplicationDbContext _context;

        public SuperAdminsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetSuperAdminsAsync()
        {
            var superAdmins = await _context.SuperAdmins.AsNoTracking()
                .Select(sa => new
                {
                    sa.Id,
                    sa.Email,
                    sa.FullName,
                    sa.ProfilePictureUrl
                })
                .ToListAsync();

            return superAdmins;
        }

        public async Task<object> RegisterSuperAdminAsync(RegisterSuperAdminDto dto)
        {
            if (await _context.SuperAdmins.AnyAsync(sa => sa.Email == dto.Email))
            {
                throw new ArgumentException("Email is already registered as a Super Admin.");
            }

            var newSuperAdmin = new SuperAdmin
            {
                Email = dto.Email,
                FullName = dto.FullName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };

            _context.SuperAdmins.Add(newSuperAdmin);
            await _context.SaveChangesAsync();

            return new { message = "Super Admin registered successfully." };
        }
    }
}
