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
using Backend.Hubs;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;

namespace Backend.Services
{
    public class RewardsService : IRewardsService
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IHubContext<AdminDashboardHub> _hubContext;

        public RewardsService(ApplicationDbContext context, IEmailService emailService, IHubContext<AdminDashboardHub> hubContext)
        {
            _context = context;
            _emailService = emailService;
            _hubContext = hubContext;
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
                    var allTasksCount = await _context.ProjectTasks.CountAsync();
                    var completedTasksCountAdmin = await _context.ProjectTasks.CountAsync(t => t.Status == "Done" || t.Status == "Completed");
                    var completedProjectsCountAdmin = await _context.Projects.CountAsync(p => p.Status == "Completed" || p.Status == "Done");
                    int adminEfficiency = allTasksCount > 0 ? (int)Math.Round((double)completedTasksCountAdmin / allTasksCount * 100) : 100;

                    return new
                    {
                        points = 0,
                        claimedBonuses = new string[] {},
                        completedTasks = completedTasksCountAdmin,
                        completedProjects = completedProjectsCountAdmin,
                        efficiency = adminEfficiency,
                        weeklyLogins = 7,
                        monthlyLogins = 30
                    };
                }
                throw new KeyNotFoundException("User not found.");
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
            var completedTasksCount = totalTasks.Count(t => t.Status == "Done" || t.Status == "Completed");
            var totalTasksCount = totalTasks.Count;

            var completedProjectsCount = user.Projects.Count(p => 
                p.Status == "Completed" || p.Status == "Done" ||
                (p.Tasks.Any() && p.Tasks.All(t => t.Status == "Done" || t.Status == "Completed"))
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
            
            string requesterEmail = "";
            string requesterName = "";

            if (user == null) 
            {
                if (isAdmin) 
                {
                    var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Id == userId);
                    if (admin != null)
                    {
                        requesterEmail = admin.Email;
                        requesterName = admin.FullName;
                    }
                    else
                    {
                        var superAdmin = await _context.SuperAdmins.FirstOrDefaultAsync(sa => sa.Id == userId);
                        if (superAdmin != null)
                        {
                            requesterEmail = superAdmin.Email;
                            requesterName = superAdmin.FullName;
                        }
                        else
                        {
                            return new { message = "Reward redeemed successfully!", currentPoints = 9999 };
                        }
                    }
                }
                else
                {
                    throw new KeyNotFoundException("User not found.");
                }
            }
            else
            {
                if (user.Points < request.Points)
                {
                    throw new InvalidOperationException("Insufficient points balance.");
                }
                user.Points -= request.Points;
                requesterEmail = user.Email;
                requesterName = user.FullName;
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
User ID: {userId}
Employee Name: {requesterName}
Employee Email: {requesterEmail}

Reward Details:
- Reward Name: {request.Title}
- Points Deducted: {request.Points} pts

Status: Pending HR Verification & Processing
==================================================";

                    System.IO.File.WriteAllText(filePath, fileContent);
                    Console.WriteLine($"[HR LOG] Leave voucher request file successfully saved to: {filePath}");

                    var adminEmails = await _context.Admins.Select(a => a.Email).ToListAsync();
                    var superAdminEmails = await _context.SuperAdmins.Select(sa => sa.Email).ToListAsync();
                    var allAdmins = adminEmails.Concat(superAdminEmails).Distinct().ToList();

                    if (isAdmin)
                    {
                        allAdmins = allAdmins.Where(e => e != requesterEmail).ToList();
                    }

                    var appNotification = new AppNotification
                    {
                        Title = "New Leave Voucher Request",
                        Message = $"{requesterName} has requested a Leave Voucher and is pending approval.",
                        Type = "LeaveRequest",
                        CreatedAt = DateTime.UtcNow,
                        IsRead = false
                    };
                    _context.AppNotifications.Add(appNotification);
                    await _context.SaveChangesAsync();

                    await _hubContext.Clients.All.SendAsync("ReceiveStatsUpdate");

                    string emailHtml = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
    <div style='background-color: #6366f1; padding: 20px; color: white; text-align: center;'>
        <h2 style='margin: 0;'>New Leave Voucher Request</h2>
    </div>
    <div style='padding: 30px; background-color: #f9f9f9;'>
        <p style='font-size: 16px; color: #333;'><strong>{requesterName}</strong> has requested a Leave Voucher.</p>
        
        <div style='background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #6366f1;'>
            <p style='margin: 0 0 10px 0;'><strong>Email:</strong> {requesterEmail}</p>
            <p style='margin: 0 0 10px 0;'><strong>Reward:</strong> {request.Title}</p>
            <p style='margin: 0;'><strong>Points Deducted:</strong> {request.Points} pts</p>
        </div>

        <div style='text-align: center; margin-top: 30px;'>
            <p>Please review this request in the Admin Dashboard.</p>
        </div>
    </div>
</div>";

                    _ = Task.Run(() => Task.WhenAll(allAdmins.Select(email => _emailService.SendEmailAsync(email, "New Leave Voucher Request", emailHtml))));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[HR LOG ERROR] Failed to write leave voucher request or send email: {ex.Message}");
                }
            }

            return new { Points = user?.Points ?? 9999 };
        }

        public async Task<object> GetAllRedemptionsAsync(ClaimsPrincipal userPrincipal)
        {
            bool isAdmin = userPrincipal.Claims.Any(c => (c.Type == ClaimTypes.Role || c.Type == "role") && (c.Value == "Admin" || c.Value == "SuperAdmin"));
            if (!isAdmin)
            {
                throw new UnauthorizedAccessException("Only admins can access this resource.");
            }

            var redemptions = await _context.RewardRedemptions.OrderByDescending(r => r.RedeemedAt).ToListAsync();

            var users = await _context.Users.ToDictionaryAsync(u => u.Id, u => new { u.FullName, u.Email });
            var admins = await _context.Admins.ToDictionaryAsync(a => a.Id, a => new { a.FullName, a.Email });
            var superAdmins = await _context.SuperAdmins.ToDictionaryAsync(sa => sa.Id, sa => new { sa.FullName, sa.Email });

            var result = new List<object>();

            foreach (var r in redemptions)
            {
                string userName = "Unknown User";
                string userEmail = "unknown@example.com";

                if (users.ContainsKey(r.UserId))
                {
                    userName = users[r.UserId].FullName;
                    userEmail = users[r.UserId].Email;
                }
                else if (admins.ContainsKey(r.UserId))
                {
                    userName = admins[r.UserId].FullName;
                    userEmail = admins[r.UserId].Email;
                }
                else if (superAdmins.ContainsKey(r.UserId))
                {
                    userName = superAdmins[r.UserId].FullName;
                    userEmail = superAdmins[r.UserId].Email;
                }

                result.Add(new
                {
                    id = r.Id,
                    userName = userName,
                    userEmail = userEmail,
                    title = r.Title,
                    rewardId = r.RewardId,
                    pointsSpent = r.PointsSpent,
                    redeemedAt = r.RedeemedAt,
                    status = r.Status
                });
            }

            return result;
        }

        public async Task<object> ApproveRedemptionAsync(ClaimsPrincipal userPrincipal, int redemptionId)
        {
            bool isAdmin = userPrincipal.Claims.Any(c => (c.Type == ClaimTypes.Role || c.Type == "role") && (c.Value == "Admin" || c.Value == "SuperAdmin"));
            if (!isAdmin)
            {
                throw new UnauthorizedAccessException("Only admins can approve redemptions.");
            }

            var redemption = await _context.RewardRedemptions.FirstOrDefaultAsync(r => r.Id == redemptionId);
            if (redemption == null)
            {
                throw new KeyNotFoundException("Redemption not found.");
            }

            if (redemption.Status == "Approved")
            {
                throw new InvalidOperationException("Redemption is already approved.");
            }

            redemption.Status = "Approved";

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == redemption.UserId);
            if (user != null)
            {
                var userNotification = new UserNotification
                {
                    UserId = user.Id,
                    Title = "Leave Voucher Approved",
                    Message = $"Your {redemption.Title} request has been approved by HR.",
                    Type = "LeaveApproval",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };
                _context.UserNotifications.Add(userNotification);

                string emailHtml = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
    <div style='background-color: #10b981; padding: 20px; color: white; text-align: center;'>
        <h2 style='margin: 0;'>Leave Voucher Approved!</h2>
    </div>
    <div style='padding: 30px; background-color: #f9f9f9;'>
        <p style='font-size: 16px; color: #333;'>Hello {user.FullName},</p>
        <p style='font-size: 16px; color: #333;'>Good news! Your leave voucher request has been approved.</p>
        
        <div style='background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;'>
            <p style='margin: 0 0 10px 0;'><strong>Reward:</strong> {redemption.Title}</p>
            <p style='margin: 0;'><strong>Points Deducted:</strong> {redemption.PointsSpent} pts</p>
        </div>
    </div>
</div>";

                _ = Task.Run(() => _emailService.SendEmailAsync(user.Email, "Leave Voucher Approved", emailHtml));
            }

            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("ReceiveStatsUpdate");

            return new { message = "Redemption approved successfully." };
        }

        public async Task<object> DeclineRedemptionAsync(ClaimsPrincipal userPrincipal, int redemptionId)
        {
            bool isAdmin = userPrincipal.Claims.Any(c => (c.Type == ClaimTypes.Role || c.Type == "role") && (c.Value == "Admin" || c.Value == "SuperAdmin"));
            if (!isAdmin)
            {
                throw new UnauthorizedAccessException("Only admins can decline redemptions.");
            }

            var redemption = await _context.RewardRedemptions.FirstOrDefaultAsync(r => r.Id == redemptionId);
            if (redemption == null)
            {
                throw new KeyNotFoundException("Redemption not found.");
            }

            if (redemption.Status == "Approved" || redemption.Status == "Declined")
            {
                throw new InvalidOperationException($"Redemption is already {redemption.Status.ToLower()}.");
            }

            redemption.Status = "Declined";

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == redemption.UserId);
            if (user != null)
            {
                user.Points += redemption.PointsSpent;
                
                var userNotification = new UserNotification
                {
                    UserId = user.Id,
                    Title = "Leave Voucher Declined",
                    Message = $"Your {redemption.Title} request has been declined. {redemption.PointsSpent} points have been refunded.",
                    Type = "LeaveApproval",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };
                _context.UserNotifications.Add(userNotification);

                string emailHtml = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
    <div style='background-color: #ef4444; padding: 20px; color: white; text-align: center;'>
        <h2 style='margin: 0;'>Leave Voucher Declined</h2>
    </div>
    <div style='padding: 30px; background-color: #f9f9f9;'>
        <p style='font-size: 16px; color: #333;'>Hello {user.FullName},</p>
        <p style='font-size: 16px; color: #333;'>We're sorry, but your leave voucher request could not be approved at this time.</p>
        
        <div style='background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444;'>
            <p style='margin: 0 0 10px 0;'><strong>Reward:</strong> {redemption.Title}</p>
            <p style='margin: 0;'><strong>Points Refunded:</strong> {redemption.PointsSpent} pts</p>
        </div>
    </div>
</div>";

                _ = Task.Run(() => _emailService.SendEmailAsync(user.Email, "Leave Voucher Declined", emailHtml));
            }

            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("ReceiveStatsUpdate");

            return new { message = "Redemption declined and points refunded." };
        }
    }
}
