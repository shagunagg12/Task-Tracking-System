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
using System.Security.Cryptography;
using System.Text;

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
                    .ThenInclude(a => a.User)
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
                        // Generate RSVP Links
                        string secret = "MySuperSecretKeyForRsvp_12345";
                        
                        string acceptPayload = $"{newEvent.Id}:{invitedUserId}:Going";
                        using var acceptHmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
                        string acceptHash = Convert.ToBase64String(acceptHmac.ComputeHash(Encoding.UTF8.GetBytes(acceptPayload)));
                        string acceptLink = $"http://localhost:5024/api/events/{newEvent.Id}/rsvp-email?userId={invitedUserId}&status=Going&signature={Uri.EscapeDataString(acceptHash)}";

                        string declinePayload = $"{newEvent.Id}:{invitedUserId}:Declined";
                        using var declineHmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
                        string declineHash = Convert.ToBase64String(declineHmac.ComputeHash(Encoding.UTF8.GetBytes(declinePayload)));
                        string declineLink = $"http://localhost:5024/api/events/{newEvent.Id}/rsvp-email?userId={invitedUserId}&status=Declined&signature={Uri.EscapeDataString(declineHash)}";

                        // Send email
                        await _emailService.SendEventInviteAsync(
                            invitedUser.Email, 
                            newEvent.Title, 
                            newEvent.EventDate, 
                            newEvent.Location, 
                            newEvent.Description, 
                            organizerName,
                            acceptLink,
                            declineLink);

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

        [AllowAnonymous]
        [HttpGet("{id}/rsvp-email")]
        public async Task<IActionResult> RsvpViaEmail(int id, [FromQuery] int userId, [FromQuery] string status, [FromQuery] string signature)
        {
            string secret = "MySuperSecretKeyForRsvp_12345";
            string payload = $"{id}:{userId}:{status}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var expectedHash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));
            
            if (signature != expectedHash)
            {
                return BadRequest("Invalid or expired RSVP link.");
            }
            
            var attendance = await _context.EventAttendances.FirstOrDefaultAsync(a => a.EventId == id && a.UserId == userId);
            if (attendance != null)
            {
                attendance.Status = status;

                // Award points if RSVPing "Going" for the first time
                if (status == "Going" && !attendance.IsAttended)
                {
                    var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
                    if (profile != null)
                    {
                        var companyEvent = await _context.CompanyEvents.FindAsync(id);
                        if (companyEvent != null)
                        {
                            profile.SocialPoints += companyEvent.Points;
                        }
                    }
                }

                await _context.SaveChangesAsync();
            }
            
            // Redirect to frontend dashboard
            return Redirect("http://localhost:5173/dashboard");
        }
    }

    public class RsvpRequest
    {
        public string Status { get; set; } = "Going";
    }
}
