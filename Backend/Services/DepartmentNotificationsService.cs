using Backend.Data;
using Backend.DTOs;
using Backend.Hubs;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class DepartmentNotificationsService : IDepartmentNotificationsService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<AdminDashboardHub> _hubContext;

        public DepartmentNotificationsService(ApplicationDbContext context, IHubContext<AdminDashboardHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task<object> NotifyDepartmentAsync(string departmentName, NotifyRequest request)
        {
            var announcement = new DepartmentAnnouncement
            {
                DepartmentName = departmentName,
                Title = request.Title,
                Message = request.Message
            };
            
            _context.DepartmentAnnouncements.Add(announcement);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("ReceiveUserNotification", new { 
                Id = announcement.Id,
                Department = departmentName, 
                Title = request.Title, 
                Message = request.Message,
                CreatedAt = announcement.CreatedAt
            });

            return announcement;
        }

        public async Task<object> GetDepartmentAnnouncementsAsync(string departmentName)
        {
            var announcements = await _context.DepartmentAnnouncements.AsNoTracking()
                .Where(a => a.DepartmentName == departmentName)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
            
            return announcements;
        }

        public async Task<object> UpdateAnnouncementAsync(int id, NotifyRequest request)
        {
            var announcement = await _context.DepartmentAnnouncements.FindAsync(id);
            if (announcement == null) throw new KeyNotFoundException("Announcement not found");

            announcement.Title = request.Title;
            announcement.Message = request.Message;

            await _context.SaveChangesAsync();
            return announcement;
        }

        public async Task DeleteAnnouncementAsync(int id)
        {
            var announcement = await _context.DepartmentAnnouncements.FindAsync(id);
            if (announcement == null) throw new KeyNotFoundException("Announcement not found");

            _context.DepartmentAnnouncements.Remove(announcement);
            await _context.SaveChangesAsync();
        }

        public async Task<object> GetUserNotificationsAsync(int userId)
        {
            var profile = await _context.Profiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId);
            if (profile == null || string.IsNullOrEmpty(profile.Department)) 
            {
                return new object[] { };
            }

            var announcements = await _context.DepartmentAnnouncements.AsNoTracking()
                .Where(a => a.DepartmentName == profile.Department)
                .OrderByDescending(a => a.CreatedAt)
                .Take(20)
                .ToListAsync();
            
            return announcements;
        }
    }
}
