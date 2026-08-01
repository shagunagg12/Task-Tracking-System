using Backend.Data;
using Backend.DTOs;
using Backend.Hubs;
using Backend.Interfaces;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class EventsService : IEventsService
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly AppSettings _appSettings;
        private readonly string _secretKey;

        public EventsService(ApplicationDbContext context, IEmailService emailService, IHubContext<ChatHub> hubContext, IOptions<AppSettings> appSettings)
        {
            _context = context;
            _emailService = emailService;
            _hubContext = hubContext;
            _appSettings = appSettings.Value;
            _secretKey = _appSettings.RsvpSecretKey;
        }

        public async Task<object> GetEventsAsync(int currentUserId)
        {
            var events = await _context.CompanyEvents.AsNoTracking()
                .Where(e => e.OrganizerId == currentUserId || e.Attendees.Any(a => a.UserId == currentUserId))
                .Include(e => e.Organizer)
                .Include(e => e.Attendees)
                    .ThenInclude(a => a.User)
                .OrderBy(e => e.EventDate)
                .Select(e => new
                {
                    e.Id,
                    e.Title,
                    e.Description,
                    e.Type,
                    e.EventDate,
                    e.DurationHours,
                    e.Location,
                    e.Points,
                    Organizer = string.IsNullOrEmpty(e.Organizer.FullName) ? e.Organizer.Email : e.Organizer.FullName,
                    OrganizerAvatar = string.IsNullOrEmpty(e.Organizer.ProfilePictureUrl) ? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(string.IsNullOrEmpty(e.Organizer.FullName) ? e.Organizer.Email : e.Organizer.FullName)}&background=random" : e.Organizer.ProfilePictureUrl,
                    IsOrganizer = e.OrganizerId == currentUserId,
                    TotalAttendees = e.Attendees.Count(a => a.Status == "Going" && a.UserId != e.OrganizerId),
                    AttendeesList = e.Attendees
                        .Where(a => a.Status == "Going" && a.UserId != e.OrganizerId)
                        .Select(a => new {
                            a.UserId,
                            Name = string.IsNullOrEmpty(a.User.FullName) ? a.User.Email : a.User.FullName,
                            Avatar = string.IsNullOrEmpty(a.User.ProfilePictureUrl) ? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(string.IsNullOrEmpty(a.User.FullName) ? a.User.Email : a.User.FullName)}&background=random" : a.User.ProfilePictureUrl
                        })
                        .ToList(),
                    UserRsvpStatus = e.Attendees.FirstOrDefault(a => a.UserId == currentUserId) != null ? e.Attendees.FirstOrDefault(a => a.UserId == currentUserId)!.Status : null
                })
                .ToListAsync();

            return events;
        }

        public async Task<CompanyEvent> CreateEventAsync(int currentUserId, CreateEventRequest request)
        {
            var newEvent = new CompanyEvent
            {
                Title = request.Title,
                Description = request.Description,
                Type = request.Type,
                EventDate = request.EventDate,
                DurationHours = request.DurationHours,
                Location = request.Location,
                Points = request.Points,
                OrganizerId = currentUserId
            };

            _context.CompanyEvents.Add(newEvent);
            await _context.SaveChangesAsync();
            
            var profile = await _context.Profiles.Include(p => p.User).FirstOrDefaultAsync(p => p.UserId == currentUserId);
            var organizerName = profile?.User?.FullName ?? profile?.User?.Email ?? "Organizer";
            
            if (profile != null)
            {
                profile.SocialPoints += 50; 
                await _context.SaveChangesAsync();
            }

            if (request.InvitedUserIds != null && request.InvitedUserIds.Any())
            {
                foreach (var invitedUserId in request.InvitedUserIds)
                {
                    if (invitedUserId == currentUserId) continue; 
                    
                    var attendance = new EventAttendance
                    {
                        EventId = newEvent.Id,
                        UserId = invitedUserId,
                        Status = "Invited"
                    };
                    _context.EventAttendances.Add(attendance);

                    var invitedUser = await _context.Users.FindAsync(invitedUserId);
                    if (invitedUser != null && !string.IsNullOrEmpty(invitedUser.Email))
                    {
                        string secret = _secretKey;
                        
                        string acceptPayload = $"{newEvent.Id}:{invitedUserId}:Going";
                        using var acceptHmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
                        string acceptHash = Convert.ToBase64String(acceptHmac.ComputeHash(Encoding.UTF8.GetBytes(acceptPayload)));
                        string acceptLink = $"{_appSettings.BackendUrl}/api/events/{newEvent.Id}/rsvp-email?userId={invitedUserId}&status=Going&signature={Uri.EscapeDataString(acceptHash)}";

                        string declinePayload = $"{newEvent.Id}:{invitedUserId}:Declined";
                        using var declineHmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
                        string declineHash = Convert.ToBase64String(declineHmac.ComputeHash(Encoding.UTF8.GetBytes(declinePayload)));
                        string declineLink = $"{_appSettings.BackendUrl}/api/events/{newEvent.Id}/rsvp-email?userId={invitedUserId}&status=Declined&signature={Uri.EscapeDataString(declineHash)}";

                        await _emailService.SendEventInviteAsync(
                            invitedUser.Email, 
                            newEvent.Title, 
                            newEvent.EventDate, 
                            newEvent.Location, 
                            newEvent.Description, 
                            organizerName,
                            acceptLink,
                            declineLink);

                        var message = new Message
                        {
                            SenderId = currentUserId,
                            ReceiverId = invitedUserId,
                            Content = $"Hey! I've invited you to an event: {newEvent.Title} on {newEvent.EventDate:MMM dd, yyyy h:mm tt}. Check your dashboard to RSVP!",
                            Timestamp = DateTime.UtcNow,
                            IsRead = false
                        };
                        _context.Messages.Add(message);
                        
                        await _hubContext.Clients.User(invitedUserId.ToString()).SendAsync("ReceiveMessage", new {
                            id = message.Id,
                            senderId = currentUserId,
                            receiverId = invitedUserId,
                            content = message.Content,
                            timestamp = message.Timestamp
                        });
                    }
                }
                await _context.SaveChangesAsync();
            }

            return newEvent;
        }

        public async Task<object> RsvpEventAsync(int currentUserId, int eventId, RsvpRequest request)
        {
            var companyEvent = await _context.CompanyEvents.FindAsync(eventId);
            if (companyEvent == null) throw new KeyNotFoundException("Event not found");

            var existingAttendance = await _context.EventAttendances
                .FirstOrDefaultAsync(a => a.EventId == eventId && a.UserId == currentUserId);

            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == currentUserId);
            if (profile == null) throw new KeyNotFoundException("Profile not found");

            if (existingAttendance != null)
            {
                if (existingAttendance.Status == "Going" && request.Status != "Going")
                {
                    profile.SocialPoints = Math.Max(0, profile.SocialPoints - companyEvent.Points);
                }
                else if (existingAttendance.Status != "Going" && request.Status == "Going")
                {
                    profile.SocialPoints += companyEvent.Points;
                }
                existingAttendance.Status = request.Status;
            }
            else
            {
                throw new ArgumentException("You are not invited to this event.");
            }

            await _context.SaveChangesAsync();
            return new { message = "RSVP updated successfully", newScore = profile.SocialPoints };
        }

        public async Task<bool> RsvpViaEmailAsync(int eventId, int userId, string status, string signature)
        {
            string secret = _secretKey;
            string payload = $"{eventId}:{userId}:{status}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var expectedHash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));
            
            if (signature != expectedHash)
            {
                return false;
            }
            
            var attendance = await _context.EventAttendances.FirstOrDefaultAsync(a => a.EventId == eventId && a.UserId == userId);
            if (attendance != null)
            {
                attendance.Status = status;

                if (status == "Going" && !attendance.IsAttended)
                {
                    var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
                    if (profile != null)
                    {
                        var companyEvent = await _context.CompanyEvents.FindAsync(eventId);
                        if (companyEvent != null)
                        {
                            profile.SocialPoints += companyEvent.Points;
                        }
                    }
                }

                await _context.SaveChangesAsync();
            }

            return true;
        }
    }
}
