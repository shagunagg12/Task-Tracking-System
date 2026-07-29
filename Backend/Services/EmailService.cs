using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Backend.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string message);
        Task SendMeetingInviteAsync(List<string> toEmails, string title, DateTime start, DateTime end, string meetLink, string brief);
        Task SendEventInviteAsync(string toEmail, string title, DateTime eventDate, string location, string description, string organizerName);
    }

    public class SmtpEmailService : IEmailService
    {
        private readonly string _smtpEmail;
        private readonly string _smtpPassword;

        public SmtpEmailService()
        {
            _smtpEmail = Environment.GetEnvironmentVariable("SMTP_EMAIL") ?? "";
            _smtpPassword = Environment.GetEnvironmentVariable("SMTP_PASSWORD") ?? "";
        }

        public async Task SendEmailAsync(string toEmail, string subject, string message)
        {
            if (string.IsNullOrEmpty(_smtpEmail) || string.IsNullOrEmpty(_smtpPassword))
            {
                Console.WriteLine("SMTP credentials not configured. Skipping email send.");
                return;
            }

            var email = new MimeMessage();
            email.From.Add(new MailboxAddress("Matts Meetings", _smtpEmail));
            email.To.Add(new MailboxAddress("", toEmail));
            email.Subject = subject;

            email.Body = new TextPart(MimeKit.Text.TextFormat.Html)
            {
                Text = message
            };

            using var smtp = new SmtpClient();
            try
            {
                // Connect to Gmail SMTP (change if using a different provider)
                await smtp.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
                await smtp.AuthenticateAsync(_smtpEmail, _smtpPassword);
                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending email to {toEmail}: {ex.Message}");
            }
        }

        public async Task SendMeetingInviteAsync(List<string> toEmails, string title, DateTime start, DateTime end, string meetLink, string brief)
        {
            string subject = $"Invitation: {title} @ {start:MMM dd, yyyy h:mm tt}";
            
            // Generate a beautiful HTML email
            string htmlMessage = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
    <div style='background-color: #4a90e2; padding: 20px; color: white; text-align: center;'>
        <h2 style='margin: 0;'>{title}</h2>
    </div>
    <div style='padding: 30px; background-color: #f9f9f9;'>
        <p style='font-size: 16px; color: #333;'>You have been invited to a meeting.</p>
        
        <div style='background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4a90e2;'>
            <p style='margin: 0 0 10px 0;'><strong>When:</strong> {start:MMM dd, yyyy} from {start:h:mm tt} to {end:h:mm tt}</p>
            <p style='margin: 0;'><strong>Brief:</strong> {brief}</p>
        </div>

        <div style='text-align: center; margin-top: 30px;'>
            <a href='{meetLink}' style='background-color: #4a90e2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;'>Join Google Meet</a>
        </div>
        <p style='text-align: center; margin-top: 15px; font-size: 12px; color: #777;'>Or copy link: {meetLink}</p>
    </div>
</div>
";

            foreach (var email in toEmails)
            {
                await SendEmailAsync(email, subject, htmlMessage);
            }
        }

        public async Task SendEventInviteAsync(string toEmail, string title, DateTime eventDate, string location, string description, string organizerName)
        {
            string subject = $"Event Invitation: {title}";
            
            string htmlMessage = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
    <div style='background-color: #6366f1; padding: 20px; color: white; text-align: center;'>
        <h2 style='margin: 0;'>{title}</h2>
    </div>
    <div style='padding: 30px; background-color: #f9f9f9;'>
        <p style='font-size: 16px; color: #333;'>You have been invited to an event by <strong>{organizerName}</strong>!</p>
        
        <div style='background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #6366f1;'>
            <p style='margin: 0 0 10px 0;'><strong>Date & Time:</strong> {eventDate:MMM dd, yyyy h:mm tt}</p>
            <p style='margin: 0 0 10px 0;'><strong>Location:</strong> {location}</p>
            <p style='margin: 0;'><strong>Details:</strong> {description}</p>
        </div>

        <div style='text-align: center; margin-top: 30px;'>
            <a href='http://localhost:5173/dashboard' style='background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;'>View Invitation</a>
        </div>
    </div>
</div>
";
            await SendEmailAsync(toEmail, subject, htmlMessage);
        }
    }
}
