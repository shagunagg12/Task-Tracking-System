using Backend.Data;
using Backend.DTOs;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class RewardsService : IRewardsService
    {
        private readonly ApplicationDbContext _context;

        public RewardsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetStatusAsync(ClaimsPrincipal userPrincipal, int userId)
        {
            var user = await _context.Users
                .Include(u => u.Projects)
                .ThenInclude(p => p.Tasks)
                .FirstOrDefaultAsync(u => u.Id == userId);

            bool isAdmin = userPrincipal.Claims.Any(c => (c.Type == ClaimTypes.Role || c.Type == "role") && (c.Value == "Admin" || c.Value == "SuperAdmin"));

            if (user == null) 
            {
                if (isAdmin)
                {
                    return new
                    {
                        points = 9999,
                        claimedBonuses = new string[] {},
                        completedTasks = 100,
                        completedProjects = 50,
                        efficiency = 99,
                        weeklyLogins = 7,
                        monthlyLogins = 30
                    };
                }
                throw new KeyNotFoundException("User not found.");
            }

            if (user.Points == 0)
            {
                user.Points = 1250;
                await _context.SaveChangesAsync();
            }

            var todayStart = DateTime.UtcNow.Date;
            var todayEnd = todayStart.AddDays(1);
            
            var totalLogsCount = await _context.UserLoginLogs.CountAsync(l => l.UserId == userId);
            if (totalLogsCount == 0)
            {
                for (int i = 0; i < 21; i++)
                {
                    _context.UserLoginLogs.Add(new UserLoginLog
                    {
                        UserId = userId,
                        LoginDate = DateTime.UtcNow.AddDays(-i)
                    });
                }
                await _context.SaveChangesAsync();
            }
            else
            {
                var alreadyLogged = await _context.UserLoginLogs
                    .AnyAsync(l => l.UserId == userId && l.LoginDate >= todayStart && l.LoginDate < todayEnd);
                if (!alreadyLogged)
                {
                    _context.UserLoginLogs.Add(new UserLoginLog
                    {
                        UserId = userId,
                        LoginDate = DateTime.UtcNow
                    });
                    await _context.SaveChangesAsync();
                }
            }

            var sevenDaysAgo = DateTime.UtcNow.Date.AddDays(-6);
            var weeklyLogins = await _context.UserLoginLogs
                .Where(l => l.UserId == userId && l.LoginDate >= sevenDaysAgo)
                .Select(l => l.LoginDate.Date)
                .Distinct()
                .CountAsync();

            var thirtyDaysAgo = DateTime.UtcNow.Date.AddDays(-29);
            var monthlyLogins = await _context.UserLoginLogs
                .Where(l => l.UserId == userId && l.LoginDate >= thirtyDaysAgo)
                .Select(l => l.LoginDate.Date)
                .Distinct()
                .CountAsync();

            var totalTasks = user.Projects.SelectMany(p => p.Tasks).ToList();
            var completedTasksCount = totalTasks.Count(t => t.Status == "Done");
            var totalTasksCount = totalTasks.Count;

            var completedProjectsCount = user.Projects.Count(p => 
                p.Status == "Completed" || 
                (p.Tasks.Any() && p.Tasks.All(t => t.Status == "Done"))
            );

            int efficiency = totalTasks.Any() 
                ? (int)Math.Round((double)completedTasksCount / totalTasksCount * 100) 
                : 75;

            var claimedBonuses = await _context.UserClaimedBonuses
                .Where(b => b.UserId == userId)
                .Select(b => b.BonusId)
                .ToListAsync();

            return new
            {
                Points = user.Points,
                CompletedTasks = completedTasksCount,
                CompletedProjects = completedProjectsCount,
                Efficiency = efficiency,
                ClaimedBonuses = claimedBonuses,
                WeeklyLogins = weeklyLogins,
                MonthlyLogins = monthlyLogins
            };
        }

        public async Task<object> ClaimBonusAsync(ClaimsPrincipal userPrincipal, int userId, ClaimBonusRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            bool isAdmin = userPrincipal.Claims.Any(c => (c.Type == ClaimTypes.Role || c.Type == "role") && (c.Value == "Admin" || c.Value == "SuperAdmin"));
            
            if (user == null) 
            {
                if (isAdmin) return new { Points = 9999 };
                throw new KeyNotFoundException("User not found.");
            }

            var alreadyClaimed = await _context.UserClaimedBonuses
                .AnyAsync(b => b.UserId == userId && b.BonusId == request.BonusId);

            if (alreadyClaimed)
            {
                throw new InvalidOperationException("Bonus has already been claimed.");
            }

            var claim = new UserClaimedBonus
            {
                UserId = userId,
                BonusId = request.BonusId,
                ClaimedAt = DateTime.UtcNow
            };

            _context.UserClaimedBonuses.Add(claim);
            user.Points += request.RewardPoints;

            await _context.SaveChangesAsync();

            return new { Points = user.Points };
        }

        public async Task<object> RedeemRewardAsync(ClaimsPrincipal userPrincipal, int userId, RedeemRewardRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            bool isAdmin = userPrincipal.Claims.Any(c => (c.Type == ClaimTypes.Role || c.Type == "role") && (c.Value == "Admin" || c.Value == "SuperAdmin"));
            
            if (user == null) 
            {
                if (isAdmin) return new { message = "Reward redeemed successfully!", currentPoints = 9999 };
                throw new KeyNotFoundException("User not found.");
            }

            if (user.Points < request.Points)
            {
                throw new InvalidOperationException("Insufficient points balance.");
            }

            var redemption = new RewardRedemption
            {
                UserId = userId,
                RewardId = request.RewardId,
                Title = request.Title,
                PointsSpent = request.Points,
                RedeemedAt = DateTime.UtcNow,
                Status = "Approved" 
            };

            bool isLeaveVoucher = request.RewardId == "leave-voucher" || request.Title.Contains("Leave");
            if (isLeaveVoucher)
            {
                redemption.Status = "Pending HR Approval";
            }

            _context.RewardRedemptions.Add(redemption);
            user.Points -= request.Points;

            await _context.SaveChangesAsync();

            if (isLeaveVoucher)
            {
                try
                {
                    string rootPath = Directory.GetCurrentDirectory();
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

            return new { Points = user.Points };
        }
    }
}
