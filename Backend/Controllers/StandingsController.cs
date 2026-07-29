using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Linq;

namespace Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class StandingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StandingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("social")]
        public async Task<IActionResult> GetSocialStandings()
        {
            var standings = await _context.Profiles
                .Include(p => p.User)
                .OrderByDescending(p => p.SocialPoints)
                .Select(p => new
                {
                    UserId = p.UserId,
                    Name = string.IsNullOrEmpty(p.User.FullName) ? p.User.Email : p.User.FullName,
                    Avatar = string.IsNullOrEmpty(p.User.ProfilePictureUrl) ? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(string.IsNullOrEmpty(p.User.FullName) ? p.User.Email : p.User.FullName)}&background=random" : p.User.ProfilePictureUrl,
                    Department = p.Department,
                    Score = p.SocialPoints
                })
                .ToListAsync();

            return Ok(standings);
        }

        [HttpGet("efficiency")]
        public async Task<IActionResult> GetEfficiencyStandings()
        {
            // Fetch all users to dynamically calculate efficiency
            var users = await _context.Profiles
                .Include(p => p.User)
                .ToListAsync();
            
            var allProjectMembers = await _context.ProjectTeamMembers.ToListAsync();
            var allProjectTasks = await _context.ProjectTasks.ToListAsync();

            var efficiencyStandings = new List<object>();

            foreach (var profile in users)
            {
                // Projects the user is involved in
                var userProjectIds = allProjectMembers
                    .Where(tm => tm.UserId == profile.UserId)
                    .Select(tm => tm.ProjectId)
                    .ToList();
                
                // If they created projects but aren't explicitly team members, add those too
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

                // Update DB so it's cached
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

            return Ok(efficiencyStandings.OrderByDescending(s => ((dynamic)s).Score).ToList());
        }
        [HttpGet("me")]
        public async Task<IActionResult> GetMySocialDashboard()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized();
            }

            var allProfiles = await _context.Profiles
                .OrderByDescending(p => p.SocialPoints)
                .Select(p => new { p.UserId, p.SocialPoints })
                .ToListAsync();

            var myProfile = allProfiles.FirstOrDefault(p => p.UserId == currentUserId);
            if (myProfile == null) return NotFound("Profile not found");

            int rank = allProfiles.FindIndex(p => p.UserId == currentUserId) + 1;

            var myAttendances = await _context.EventAttendances
                .Include(a => a.Event)
                .ThenInclude(e => e.Organizer)
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
                    Status = a.Status
                })
                .OrderBy(e => e.EventDate)
                .ToList();

            return Ok(new
            {
                Score = myProfile.SocialPoints,
                Rank = rank,
                TotalUsers = allProfiles.Count,
                AttendedEvents = attendedEvents,
                PendingInvitations = pendingInvitations
            });
        }
    }
}
