using System;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

class TestEmail
{
    public static void RunTest()
    {
        try
        {
            var email = new MimeMessage();
            email.From.Add(new MailboxAddress("Test", "matts.meet@gmail.com"));
            email.To.Add(new MailboxAddress("", "matts.meet@gmail.com"));
            email.Subject = "Test";
            email.Body = new TextPart("plain") { Text = "Test" };

            using var smtp = new SmtpClient();
            smtp.Connect("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
            smtp.Authenticate("matts.meet@gmail.com", "pnxcaygwqwnxvmef");
            smtp.Send(email);
            smtp.Disconnect(true);
            Console.WriteLine("Success!");
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error: " + ex.Message);
        }
    }
}
