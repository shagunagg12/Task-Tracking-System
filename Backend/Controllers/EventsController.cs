using Backend.Data;
using Backend.Models;
using Backend.DTOs;
using Backend.Services;
using Backend.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IHubContext<ChatHub> _hubContext;

        public EventsController(ApplicationDbContext context, IEmailService emailService, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _emailService = emailService;
            _hubContext = hubContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetEvents()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized();
            }

            var events = await _context.CompanyEvents
                .Include(e => e.Organizer)
                .Include(e => e.Attendees)
                .OrderBy(e => e.EventDate)
                .Select(e => new
                {
                    e.Id,
                    e.Title,
                    e.Description,
                    e.Type,
                    e.EventDate,
                    e.Location,
                    e.Points,
                    Organizer = string.IsNullOrEmpty(e.Organizer.FullName) ? e.Organizer.Email : e.Organizer.FullName,
                    TotalAttendees = e.Attendees.Count(a => a.Status == "Going"),
                    UserRsvpStatus = e.Attendees.FirstOrDefault(a => a.UserId == currentUserId) != null ? e.Attendees.FirstOrDefault(a => a.UserId == currentUserId)!.Status : null
                })
                .ToListAsync();

            return Ok(events);
        }

        [HttpPost]
        public async Task<IActionResult> CreateEvent([FromBody] CreateEventRequest request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized();
            }

            var newEvent = new CompanyEvent
            {
                Title = request.Title,
                Description = request.Description,
                Type = request.Type,
                EventDate = request.EventDate,
                Location = request.Location,
                Points = request.Points,
                OrganizerId = currentUserId
            };

            _context.CompanyEvents.Add(newEvent);
            await _context.SaveChangesAsync();
            
            // Give points to organizer
            var profile = await _context.Profiles.Include(p => p.User).FirstOrDefaultAsync(p => p.UserId == currentUserId);
            var organizerName = profile?.User?.FullName ?? profile?.User?.Email ?? "Organizer";
            
            if (profile != null)
            {
                profile.SocialPoints += 50; // Bonus points for organizing
                await _context.SaveChangesAsync();
            }

            // Send invitations
            if (request.InvitedUserIds != null && request.InvitedUserIds.Any())
            {
                foreach (var invitedUserId in request.InvitedUserIds)
                {
                    if (invitedUserId == currentUserId) continue; // Don't invite self
                    
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
                        // Send email
                        await _emailService.SendEventInviteAsync(
                            invitedUser.Email, 
                            newEvent.Title, 
                            newEvent.EventDate, 
                            newEvent.Location, 
                            newEvent.Description, 
                            organizerName);

                        // Send chat message
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

            return Ok(newEvent);
        }

        [HttpPost("{id}/rsvp")]
        public async Task<IActionResult> RsvpEvent(int id, [FromBody] RsvpRequest request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized();
            }

            var companyEvent = await _context.CompanyEvents.FindAsync(id);
            if (companyEvent == null) return NotFound("Event not found");

            var existingAttendance = await _context.EventAttendances
                .FirstOrDefaultAsync(a => a.EventId == id && a.UserId == currentUserId);

            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == currentUserId);
            if (profile == null) return NotFound("Profile not found");

            if (existingAttendance != null)
            {
                // Adjust points if they cancel
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
                var attendance = new EventAttendance
                {
                    EventId = id,
                    UserId = currentUserId,
                    Status = request.Status
                };
                _context.EventAttendances.Add(attendance);
                
                if (request.Status == "Going")
                {
                    profile.SocialPoints += companyEvent.Points;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "RSVP updated successfully", newScore = profile.SocialPoints });
        }
    }

    public class RsvpRequest
    {
        public string Status { get; set; } = "Going";
    }
}
