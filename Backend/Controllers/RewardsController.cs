using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RewardsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RewardsController(ApplicationDbContext context)
        {
            _context = context;
        }

        public class ClaimBonusRequest
        {
            public string BonusId { get; set; } = string.Empty;
            public int RewardPoints { get; set; }
        }

        public class RedeemRewardRequest
        {
            public string RewardId { get; set; } = string.Empty;
            public string Title { get; set; } = string.Empty;
            public int Points { get; set; }
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users
                .Include(u => u.Projects)
                .ThenInclude(p => p.Tasks)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound("User not found.");

            // Self-healing: if points are 0, initialize to 1250
            if (user.Points == 0)
            {
                user.Points = 1250;
                await _context.SaveChangesAsync();
            }

            // Fetch actual project task completion stats
            var totalTasks = user.Projects.SelectMany(p => p.Tasks).ToList();
            var completedTasksCount = totalTasks.Count(t => t.Status == "Done");
            var totalTasksCount = totalTasks.Count;

            var completedProjectsCount = user.Projects.Count(p => 
                p.Status == "Completed" || 
                (p.Tasks.Any() && p.Tasks.All(t => t.Status == "Done"))
            );

            // Compute dynamic efficiency
            int efficiency = totalTasks.Any() 
                ? (int)Math.Round((double)completedTasksCount / totalTasksCount * 100) 
                : 75;

            // Fetch claimed milestones
            var claimedBonuses = await _context.UserClaimedBonuses
                .Where(b => b.UserId == userId)
                .Select(b => b.BonusId)
                .ToListAsync();

            return Ok(new
            {
                Points = user.Points,
                CompletedTasks = completedTasksCount,
                CompletedProjects = completedProjectsCount,
                Efficiency = efficiency,
                ClaimedBonuses = claimedBonuses
            });
        }

        [HttpPost("claim")]
        public async Task<IActionResult> ClaimBonus([FromBody] ClaimBonusRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound("User not found.");

            // Check if already claimed
            var alreadyClaimed = await _context.UserClaimedBonuses
                .AnyAsync(b => b.UserId == userId && b.BonusId == request.BonusId);

            if (alreadyClaimed)
            {
                return BadRequest("Bonus has already been claimed.");
            }

            // Record the claim
            var claim = new UserClaimedBonus
            {
                UserId = userId,
                BonusId = request.BonusId,
                ClaimedAt = DateTime.UtcNow
            };

            _context.UserClaimedBonuses.Add(claim);
            user.Points += request.RewardPoints;

            await _context.SaveChangesAsync();

            return Ok(new { Points = user.Points });
        }

        [HttpPost("redeem")]
        public async Task<IActionResult> RedeemReward([FromBody] RedeemRewardRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound("User not found.");

            if (user.Points < request.Points)
            {
                return BadRequest("Insufficient points balance.");
            }

            // Save redemption to database
            var redemption = new RewardRedemption
            {
                UserId = userId,
                RewardId = request.RewardId,
                Title = request.Title,
                PointsSpent = request.Points,
                RedeemedAt = DateTime.UtcNow,
                Status = "Approved" // default to approved for auto-rewards
            };

            // If it's a leave voucher, set status to pending HR approval
            bool isLeaveVoucher = request.RewardId == "leave-voucher" || request.Title.Contains("Leave");
            if (isLeaveVoucher)
            {
                redemption.Status = "Pending HR Approval";
            }

            _context.RewardRedemptions.Add(redemption);
            user.Points -= request.Points;

            await _context.SaveChangesAsync();

            // Connect to HR Requests Folder if it is a Leave Voucher
            if (isLeaveVoucher)
            {
                try
                {
                    // Generate HR Request Folder
                    string rootPath = Directory.GetCurrentDirectory();
                    // Go up to the main 'matts' directory if currently in Backend
                    if (rootPath.EndsWith("Backend"))
                    {
                        var parentDir = Directory.GetParent(rootPath);
                        if (parentDir != null) rootPath = parentDir.FullName;
                    }

                    string hrFolder = Path.Combine(rootPath, "HR_Requests");
                    if (!Directory.Exists(hrFolder))
                    {
                        Directory.CreateDirectory(hrFolder);
                    }

                    string fileName = $"leave_voucher_user_{userId}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.txt";
                    string filePath = Path.Combine(hrFolder, fileName);

                    string fileContent = $@"==================================================
LEAVE VOUCHER REDEMPTION REQUEST (PENDING HR APPROVAL)
==================================================
Timestamp: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC
User ID: {user.Id}
Employee Name: {user.FullName}
Employee Email: {user.Email}

Reward Details:
- Reward Name: {request.Title}
- Points Deducted: {request.Points} pts

Status: Pending HR Verification & Processing
==================================================";

                    System.IO.File.WriteAllText(filePath, fileContent);
                    Console.WriteLine($"[HR LOG] Leave voucher request file successfully saved to: {filePath}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[HR LOG ERROR] Failed to write leave voucher request to HR requests folder: {ex.Message}");
                }
            }

            return Ok(new { Points = user.Points });
        }
    }
}
