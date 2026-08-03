using Backend.Data;
using Backend.DTOs;
using Backend.Hubs;
using Backend.Interfaces;
using Backend.Models;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Calendar.v3;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class MeetingsService : IMeetingsService
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IHubContext<AdminDashboardHub> _hubContext;

        public MeetingsService(ApplicationDbContext context, IEmailService emailService, IHubContext<AdminDashboardHub> hubContext)
        {
            _context = context;
            _emailService = emailService;
            _hubContext = hubContext;
        }

        public async Task<object> CreateMeetingAsync(ClaimsPrincipal user, MeetingRequestDto request)
        {
            var userIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int organizerId))
            {
                throw new UnauthorizedAccessException("Invalid user token.");
            }

            DateTime start = DateTime.Parse($"{request.StartDate}T{request.StartTime}");
            DateTime end = DateTime.Parse($"{request.EndDate}T{request.EndTime}");

            string meetLink = "";

            var masterUser = await _context.Users.FirstOrDefaultAsync(u => !string.IsNullOrEmpty(u.GoogleRefreshToken));
            var globalRefreshToken = masterUser?.GoogleRefreshToken;

            if (string.IsNullOrEmpty(globalRefreshToken))
            {
                throw new Exception("No Master Account is connected to Google Calendar in the database. Please connect a Google Calendar.");
            }

            var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new Google.Apis.Auth.OAuth2.ClientSecrets
                {
                    ClientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID"),
                    ClientSecret = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET")
                }
            });

            var tokenResponse = new TokenResponse
            {
                AccessToken = masterUser!.GoogleAccessToken,
                RefreshToken = globalRefreshToken
            };

            var credential = new UserCredential(flow, "global-admin", tokenResponse);

            var service = new CalendarService(new Google.Apis.Services.BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "Matts"
            });

            var newEvent = new Google.Apis.Calendar.v3.Data.Event
            {
                Summary = request.Title,
                Description = request.Brief,
                Start = new Google.Apis.Calendar.v3.Data.EventDateTime { DateTimeDateTimeOffset = start },
                End = new Google.Apis.Calendar.v3.Data.EventDateTime { DateTimeDateTimeOffset = end },
                ConferenceData = new Google.Apis.Calendar.v3.Data.ConferenceData
                {
                    CreateRequest = new Google.Apis.Calendar.v3.Data.CreateConferenceRequest
                    {
                        RequestId = Guid.NewGuid().ToString(),
                        ConferenceSolutionKey = new Google.Apis.Calendar.v3.Data.ConferenceSolutionKey { Type = "hangoutsMeet" }
                    }
                }
            };

            var eventRequest = service.Events.Insert(newEvent, "primary");
            eventRequest.ConferenceDataVersion = 1;
            
            try
            {
                var createdEvent = await eventRequest.ExecuteAsync();

                if (createdEvent.ConferenceData != null && createdEvent.ConferenceData.EntryPoints != null)
                {
                    var entry = createdEvent.ConferenceData.EntryPoints.FirstOrDefault(e => e.EntryPointType == "video");
                    if (entry != null)
                    {
                        meetLink = entry.Uri;
                    }
                }

                if (string.IsNullOrEmpty(meetLink))
                {
                    throw new Exception("Failed to generate Google Meet link. Please try again or re-connect your Google account.");
                }

                int? validOrganizerId = organizerId;
                bool isAdmin = user.Claims.Any(c => (c.Type == ClaimTypes.Role || c.Type == "role") && (c.Value == "Admin" || c.Value == "SuperAdmin"));
                if (isAdmin)
                {
                    validOrganizerId = null;
                }

                var meeting = new Meeting
                {
                    Title = request.Title,
                    Brief = request.Brief,
                    StartTime = start,
                    EndTime = end,
                    MeetLink = meetLink,
                    OrganizerId = validOrganizerId
                };

                _context.Meetings.Add(meeting);
                await _context.SaveChangesAsync();

                var emails = new List<string>();

                foreach (var p in request.Participants)
                {
                    var mp = new MeetingParticipant
                    {
                        MeetingId = meeting.Id,
                        UserId = p.Id
                    };
                    _context.MeetingParticipants.Add(mp);
                    
                    var userEntity = await _context.Users.FindAsync(p.Id);
                    if (userEntity != null && !string.IsNullOrEmpty(userEntity.Email))
                    {
                        emails.Add(userEntity.Email);
                    }
                    else if (!string.IsNullOrEmpty(p.Email))
                    {
                        emails.Add(p.Email);
                    }
                }

                await _context.SaveChangesAsync();

                if (emails.Any())
                {
                    await _emailService.SendMeetingInviteAsync(emails, request.Title, start, end, meetLink, request.Brief);
                }

                var userName = user.FindFirstValue(ClaimTypes.Name) ?? "A user";
                var notification = new AppNotification
                {
                    Title = "Meeting Scheduled",
                    Message = $"{userName} scheduled a new meeting: '{meeting.Title}'",
                    Type = "meeting_scheduled",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false,
                    MeetingId = meeting.Id
                };

                _context.AppNotifications.Add(notification);
                await _context.SaveChangesAsync();
                
                await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
                {
                    id = notification.Id,
                    title = notification.Title,
                    message = notification.Message,
                    type = notification.Type,
                    createdAt = notification.CreatedAt,
                    isRead = notification.IsRead,
                    meetingId = notification.MeetingId
                });

                return new { message = "Meeting scheduled successfully", meetLink = meetLink };
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("invalid_grant"))
                {
                    if (masterUser != null)
                    {
                        masterUser.GoogleRefreshToken = null;
                        masterUser.GoogleAccessToken = null;
                        await _context.SaveChangesAsync();
                    }
                    throw new Exception("The Master Google Account token has expired or was revoked. Token has been reset. Please refresh the page and click 'Connect Google Calendar' to re-authenticate.");
                }
                throw new Exception($"An error occurred while creating the meeting: {ex.Message}");
            }
        }

        public async Task<object> GetMeetingsAsync(ClaimsPrincipal user)
        {
            var userIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                throw new UnauthorizedAccessException("Invalid user token.");
            }

            bool isAdmin = user.Claims.Any(c => (c.Type == ClaimTypes.Role || c.Type == "role") && (c.Value == "Admin" || c.Value == "SuperAdmin"));

            var query = _context.Meetings.AsQueryable();

            if (!isAdmin)
            {
                query = query.Where(m => m.OrganizerId == userId || _context.MeetingParticipants.Any(mp => mp.MeetingId == m.Id && mp.UserId == userId));
            }

            var meetings = await query
                .Select(m => new
                {
                    m.Id,
                    m.Title,
                    m.Brief,
                    m.StartTime,
                    m.EndTime,
                    m.MeetLink,
                    OrganizerId = m.OrganizerId,
                    Participants = _context.MeetingParticipants.AsNoTracking()
                        .Where(mp => mp.MeetingId == m.Id)
                        .Select(mp => new 
                        {
                            Id = mp.User!.Id,
                            FullName = mp.User.FullName,
                            Email = mp.User.Email
                        }).ToList()
                })
                .ToListAsync();

            return meetings;
        }
    }
}
