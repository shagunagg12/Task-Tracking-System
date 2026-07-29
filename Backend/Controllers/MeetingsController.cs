using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using System.Security.Claims;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Calendar.v3;

namespace Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class MeetingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public MeetingsController(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateMeeting([FromBody] MeetingRequestDto request)
        {
            try
            {
                var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int organizerId))
                {
                    return Unauthorized("Invalid user token.");
                }

                // Parse DateTimes
                DateTime start = DateTime.Parse($"{request.StartDate}T{request.StartTime}");
                DateTime end = DateTime.Parse($"{request.EndDate}T{request.EndTime}");

                // We require a strictly real Google Meet link
                string meetLink = "";

                // Fetch the master token directly from the shared Azure SQL Database
                var masterUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "matts.meet@gmail.com");
                var globalRefreshToken = masterUser?.GoogleRefreshToken;

                if (string.IsNullOrEmpty(globalRefreshToken))
                {
                    return StatusCode(500, new { message = "The Master Account (matts.meet@gmail.com) has not connected a Google Calendar in the database. Please log in as the master account and connect Google Calendar." });
                }

                var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
                {
                    ClientSecrets = new Google.Apis.Auth.OAuth2.ClientSecrets
                    {
                        ClientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID"),
                        ClientSecret = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET")
                    }
                });

                var tokenResponse = new Google.Apis.Auth.OAuth2.Responses.TokenResponse
                {
                    // Access token can be empty, Google API client will automatically refresh it using the Refresh Token
                    AccessToken = "",
                    RefreshToken = globalRefreshToken
                };

                // Use a fixed generic user ID (like "global-admin") since it's a single account for everyone
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
                    return StatusCode(500, new { message = "Failed to generate Google Meet link. Please try again or re-connect your Google account." });
                }

                var meeting = new Meeting
                {
                    Title = request.Title,
                    Brief = request.Brief,
                    StartTime = start,
                    EndTime = end,
                    MeetLink = meetLink,
                    OrganizerId = organizerId
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
                    emails.Add(p.Email);
                }

                await _context.SaveChangesAsync();

                // Send Emails
                if (emails.Any())
                {
                    await _emailService.SendMeetingInviteAsync(emails, request.Title, start, end, meetLink, request.Brief);
                }

                return Ok(new { message = "Meeting scheduled successfully", meetLink = meetLink });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the meeting.", error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetMeetings()
        {
            try
            {
                var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
                {
                    return Unauthorized("Invalid user token.");
                }

                var meetings = await _context.Meetings
                    .Where(m => m.OrganizerId == userId || _context.MeetingParticipants.Any(mp => mp.MeetingId == m.Id && mp.UserId == userId))
                    .Select(m => new
                    {
                        m.Id,
                        m.Title,
                        m.Brief,
                        m.StartTime,
                        m.EndTime,
                        m.MeetLink,
                        OrganizerId = m.OrganizerId,
                        Participants = _context.MeetingParticipants
                            .Where(mp => mp.MeetingId == m.Id)
                            .Select(mp => new 
                            {
                                Id = mp.User.Id,
                                FullName = mp.User.FullName,
                                Email = mp.User.Email
                            }).ToList()
                    })
                    .ToListAsync();

                return Ok(meetings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching meetings.", error = ex.Message });
            }
        }
    }

    public class MeetingRequestDto
    {
        public string Title { get; set; }
        public string Brief { get; set; }
        public string StartDate { get; set; }
        public string StartTime { get; set; }
        public string EndDate { get; set; }
        public string EndTime { get; set; }
        public List<ParticipantDto> Participants { get; set; }
    }

    public class ParticipantDto
    {
        public int Id { get; set; }
        public string Email { get; set; }
    }
}
