using Backend.Data;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class StandingsService : IStandingsService
    {
        private readonly ApplicationDbContext _context;

        public StandingsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetSocialStandingsAsync(string timeframe)
        {
            var users = await _context.Profiles.AsNoTrackingWithIdentityResolution()
                .Include(p => p.User)
                .ToListAsync();

            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;

            var allAttendances = await _context.EventAttendances.AsNoTrackingWithIdentityResolution()
                .Include(a => a.Event)
                .Where(a => a.Status == "Going" || a.IsAttended)
                .ToListAsync();
            
            var allEvents = await _context.CompanyEvents.AsNoTrackingWithIdentityResolution().ToListAsync();

            var standings = users.Select(p => {
                int score = p.SocialPoints; 

                if (timeframe.ToLower() == "this month")
                {
                    int attendedPoints = allAttendances
                        .Where(a => a.UserId == p.UserId && a.Event.EventDate.Month == currentMonth && a.Event.EventDate.Year == currentYear)
                        .Sum(a => a.Event.Points);

                    int organizedPoints = allEvents
                        .Where(e => e.OrganizerId == p.UserId && e.EventDate.Month == currentMonth && e.EventDate.Year == currentYear)
                        .Count() * 50;

                    score = attendedPoints + organizedPoints;
                }

                return new
                {
                    UserId = p.UserId,
                    Name = string.IsNullOrEmpty(p.User.FullName) ? p.User.Email : p.User.FullName,
                    Avatar = string.IsNullOrEmpty(p.User.ProfilePictureUrl) ? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(string.IsNullOrEmpty(p.User.FullName) ? p.User.Email : p.User.FullName)}&background=random" : p.User.ProfilePictureUrl,
                    Department = p.Department,
                    Score = score
                };
            })
            .Where(p => p.Score > 0)
            .OrderByDescending(p => p.Score)
            .ToList();

            return standings;
        }

        public async Task<object> GetEfficiencyStandingsAsync()
        {
            var users = await _context.Profiles
                .Include(p => p.User)
                .ToListAsync();
            
            var allProjectMembers = await _context.ProjectTeamMembers.ToListAsync();
            var allProjectTasks = await _context.ProjectTasks.ToListAsync();

            var efficiencyStandings = new List<object>();

            foreach (var profile in users)
            {
                var userProjectIds = allProjectMembers
                    .Where(tm => tm.UserId == profile.UserId)
                    .Select(tm => tm.ProjectId)
                    .ToList();
                
                var ownedProjectIds = await _context.Projects
                    .Where(p => p.UserId == profile.UserId)
                    .Select(p => p.Id)
                    .ToListAsync();
                
                var allRelevantProjectIds = userProjectIds.Concat(ownedProjectIds).Distinct().ToList();

                var userTasks = allProjectTasks.Where(t => allRelevantProjectIds.Contains(t.ProjectId)).ToList();
                
                double efficiencyScore = 0;
                if (userTasks.Count > 0)
                {
                    int completed = userTasks.Count(t => t.Status.ToLower().Contains("completed") || t.Status.ToLower().Contains("done"));
                    efficiencyScore = Math.Round(((double)completed / userTasks.Count) * 100, 1);
                }

                profile.EfficiencyScore = efficiencyScore;

                efficiencyStandings.Add(new
                {
                    UserId = profile.UserId,
                    Name = string.IsNullOrEmpty(profile.User.FullName) ? profile.User.Email : profile.User.FullName,
                    Avatar = string.IsNullOrEmpty(profile.User.ProfilePictureUrl) ? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(string.IsNullOrEmpty(profile.User.FullName) ? profile.User.Email : profile.User.FullName)}&background=random" : profile.User.ProfilePictureUrl,
                    Department = profile.Department,
                    Score = efficiencyScore,
                    TotalTasks = userTasks.Count,
                    CompletedTasks = userTasks.Count(t => t.Status.ToLower().Contains("completed") || t.Status.ToLower().Contains("done"))
                });
            }

            await _context.SaveChangesAsync();

            return efficiencyStandings.OrderByDescending(s => ((dynamic)s).Score).ToList();
        }

        public async Task<object> GetMySocialDashboardAsync(int currentUserId)
        {
            var allProfiles = await _context.Profiles.AsNoTrackingWithIdentityResolution()
                .OrderByDescending(p => p.SocialPoints)
                .Select(p => new { p.UserId, p.SocialPoints })
                .ToListAsync();

            var myProfile = allProfiles.FirstOrDefault(p => p.UserId == currentUserId);
            if (myProfile == null) throw new KeyNotFoundException("Profile not found");

            int rank = allProfiles.FindIndex(p => p.UserId == currentUserId) + 1;

            // Use a tracking query here since no-tracking queries in EF Core do not allow cyclic includes (Event -> Attendees -> Event)
            var myAttendances = await _context.EventAttendances
                .Include(a => a.Event)
                    .ThenInclude(e => e.Organizer)
                .Include(a => a.Event)
                    .ThenInclude(e => e.Attendees)
                        .ThenInclude(att => att.User)
                .Where(a => a.UserId == currentUserId)
                .ToListAsync();

            var attendedEvents = myAttendances
                .Where(a => a.Status == "Going" || a.IsAttended)
                .Select(a => new
                {
                    a.Event.Id,
                    a.Event.Title,
                    a.Event.Description,
                    a.Event.Type,
                    a.Event.EventDate,
                    a.Event.Location,
                    a.Event.Points,
                    Organizer = string.IsNullOrEmpty(a.Event.Organizer.FullName) ? a.Event.Organizer.Email : a.Event.Organizer.FullName,
                    Status = a.Status
                })
                .OrderByDescending(e => e.EventDate)
                .ToList();

            var pendingInvitations = myAttendances
                .Where(a => a.Status == "Invited")
                .Select(a => new
                {
                    a.Event.Id,
                    a.Event.Title,
                    a.Event.Description,
                    a.Event.Type,
                    a.Event.EventDate,
                    a.Event.Location,
                    a.Event.Points,
                    Organizer = string.IsNullOrEmpty(a.Event.Organizer.FullName) ? a.Event.Organizer.Email : a.Event.Organizer.FullName,
                    Status = a.Status,
                    TotalAttendees = a.Event.Attendees.Count(att => att.Status == "Going"),
                    AttendeesList = a.Event.Attendees
                        .Where(att => att.Status == "Going")
                        .Take(5)
                        .Select(att => new {
                            att.UserId,
                            Name = string.IsNullOrEmpty(att.User.FullName) ? att.User.Email : att.User.FullName,
                            Avatar = string.IsNullOrEmpty(att.User.ProfilePictureUrl) ? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(string.IsNullOrEmpty(att.User.FullName) ? att.User.Email : att.User.FullName)}&background=random" : att.User.ProfilePictureUrl
                        })
                        .ToList()
                })
                .OrderBy(e => e.EventDate)
                .ToList();

            int eventsOrganized = await _context.CompanyEvents.AsNoTrackingWithIdentityResolution().CountAsync(e => e.OrganizerId == currentUserId);
            int attendanceRate = myAttendances.Count > 0 ? (int)Math.Round((double)attendedEvents.Count / myAttendances.Count * 100) : 0;

            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;

            int pointsThisMonth = myAttendances
                .Where(a => (a.Status == "Going" || a.IsAttended) && a.Event.EventDate.Month == currentMonth && a.Event.EventDate.Year == currentYear)
                .Sum(a => a.Event.Points);
                
            int organizedPointsThisMonth = await _context.CompanyEvents.AsNoTrackingWithIdentityResolution()
                .Where(e => e.OrganizerId == currentUserId && e.EventDate.Month == currentMonth && e.EventDate.Year == currentYear)
                .CountAsync() * 50;
                
            pointsThisMonth += organizedPointsThisMonth;
            
            int badgesEarned = (attendedEvents.Count / 3) + (eventsOrganized / 2);
            if (badgesEarned == 0 && (attendedEvents.Count > 0 || eventsOrganized > 0)) badgesEarned = 1;

            return new
            {
                UserId = currentUserId,
                Score = myProfile.SocialPoints,
                Rank = rank,
                TotalUsers = allProfiles.Count,
                Level = (myProfile.SocialPoints / 100) + 1,
                PointsThisMonth = pointsThisMonth,
                EventsOrganized = eventsOrganized,
                BadgesEarned = badgesEarned,
                AttendanceRate = attendanceRate,
                AttendedEvents = attendedEvents,
                PendingInvitations = pendingInvitations
            };
        }
    }
}
