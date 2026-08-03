using Backend.Data;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Backend.Hubs;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", Serilog.Events.LogEventLevel.Warning)
    .WriteTo.Console()
    .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Load the custom .env file from the env folder manually to bypass DotNetEnv bugs
var envPath = Path.Combine(builder.Environment.ContentRootPath, "env", ".env");
if (System.IO.File.Exists(envPath))
{
    foreach (var line in System.IO.File.ReadAllLines(envPath))
    {
        if (string.IsNullOrWhiteSpace(line) || !line.Contains('=')) continue;
        var parts = line.Split('=', 2);
        Environment.SetEnvironmentVariable(parts[0].Trim(), parts[1].Trim());
    }
}

// Construct connection string from environment variables
var dbServer = Environment.GetEnvironmentVariable("DB_SERVER");
var dbName = Environment.GetEnvironmentVariable("DB_NAME");
var dbUser = Environment.GetEnvironmentVariable("DB_USER");
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");

string connectionString;
if (string.IsNullOrWhiteSpace(dbUser))
{
    // Use Windows Authentication (no username/password needed for local SSMS)
    connectionString = $"Server={dbServer};Database={dbName};Integrated Security=True;TrustServerCertificate=True;";
}
else
{
    // Use SQL Server Authentication
    connectionString = $"Server={dbServer};Database={dbName};User Id={dbUser};Password={dbPassword};TrustServerCertificate=True;";
}

Console.WriteLine("=============================================");
Console.WriteLine($"USING CONNECTION STRING: {connectionString}");
Console.WriteLine("=============================================");

// Add services to the container.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions => sqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));

// Add CORS to connect the frontend without modifying frontend code
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.SetIsOriginAllowed(origin => true) // Allow any origin for local dev on mobile
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

builder.Services.Configure<Backend.Models.AppSettings>(builder.Configuration.GetSection("AppSettings"));
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? builder.Configuration.GetSection("AppSettings")["JwtSecretFallback"] ?? "super_secret_fallback_key_that_is_long_enough_12345!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

builder.Services.AddScoped<Backend.Services.IEmailService, Backend.Services.SmtpEmailService>();
builder.Services.AddHttpClient();

builder.Services.AddScoped<Backend.Interfaces.IAdminDashboardService, Backend.Services.AdminDashboardService>();
builder.Services.AddScoped<Backend.Interfaces.IAdminProjectsService, Backend.Services.AdminProjectsService>();
builder.Services.AddScoped<Backend.Interfaces.IAdminReportsService, Backend.Services.AdminReportsService>();
builder.Services.AddScoped<Backend.Interfaces.IAdminUsersService, Backend.Services.AdminUsersService>();
builder.Services.AddScoped<Backend.Interfaces.IAnalyticsService, Backend.Services.AnalyticsService>();
builder.Services.AddScoped<Backend.Interfaces.IAuthService, Backend.Services.AuthService>();
builder.Services.AddScoped<Backend.Interfaces.IDepartmentNotificationsService, Backend.Services.DepartmentNotificationsService>();
builder.Services.AddScoped<Backend.Interfaces.IDepartmentsService, Backend.Services.DepartmentsService>();
builder.Services.AddScoped<Backend.Interfaces.IEventsService, Backend.Services.EventsService>();
builder.Services.AddScoped<Backend.Interfaces.IGoogleOAuthService, Backend.Services.GoogleOAuthService>();
builder.Services.AddScoped<Backend.Interfaces.IMeetingsService, Backend.Services.MeetingsService>();
builder.Services.AddScoped<Backend.Interfaces.IMessagesService, Backend.Services.MessagesService>();
builder.Services.AddScoped<Backend.Interfaces.IProfileService, Backend.Services.ProfileService>();
builder.Services.AddScoped<Backend.Interfaces.IProjectsService, Backend.Services.ProjectsService>();
builder.Services.AddScoped<Backend.Interfaces.IRewardsService, Backend.Services.RewardsService>();
builder.Services.AddScoped<Backend.Interfaces.IStandingsService, Backend.Services.StandingsService>();
builder.Services.AddScoped<Backend.Interfaces.ISuperAdminsService, Backend.Services.SuperAdminsService>();
builder.Services.AddScoped<Backend.Interfaces.IUploadService, Backend.Services.UploadService>();


builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();


var app = builder.Build();

app.UseMiddleware<Backend.Middleware.GlobalExceptionMiddleware>();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ChatHub>("/chatHub");
app.MapHub<AdminDashboardHub>("/adminDashboardHub");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast")
.WithOpenApi();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    // Ensure UserPoints table is created
    try
    {
        using (var command = context.Database.GetDbConnection().CreateCommand())
        {
            command.CommandText = @"
                IF OBJECT_ID('UserPoints', 'U') IS NULL
                CREATE TABLE UserPoints (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    UserId INT NOT NULL,
                    Points INT NOT NULL
                );";
            context.Database.OpenConnection();
            command.ExecuteNonQuery();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DB ERROR] Failed to create UserPoints table: {ex.Message}");
    }

    if (!context.Admins.Any(a => a.Email == "connect2rachit882@gmail.com"))
    {
        var admin = new Backend.Models.Admin
        {
            Email = "connect2rachit882@gmail.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Rachit@12")
        };
        context.Admins.Add(admin);
        context.SaveChanges();
    }
    if (!context.Users.Any(u => u.Email == "alice.engineer@example.com"))
    {
        var dummyUser = new Backend.Models.User
        {
            FullName = "Alice Engineer",
            Email = "alice.engineer@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            Points = 0,
            Profile = new Backend.Models.UserProfile
            {
                Department = "Engineering",
                Designation = "Senior Developer",
                Location = "Remote",
                Bio = "I write code."
            }
        };
        context.Users.Add(dummyUser);
        context.SaveChanges();
    }

    // Reset points to 0 for everyone on startup in the UserPoints table, and clear redemptions
    try
    {
        var allPoints = context.UserPoints.ToList();
        context.UserPoints.RemoveRange(allPoints);
        
        var allRedemptions = context.RewardRedemptions.ToList();
        context.RewardRedemptions.RemoveRange(allRedemptions);

        context.SaveChanges();
    }
    catch (Exception)
    {
        // Table might not exist yet before migration
    }

    // Sync admin profile pictures to user records
    var admins = context.Admins.ToList();
    foreach (var admin in admins)
    {
        var u = context.Users.FirstOrDefault(x => x.Email == admin.Email);
        if (u != null && !string.IsNullOrEmpty(admin.ProfilePictureUrl))
        {
            u.ProfilePictureUrl = admin.ProfilePictureUrl;
        }
    }
    context.SaveChanges();

    var users = context.Users.Include(u => u.Projects).ToList();
    foreach (var u in users)
    {
        context.UserPoints.Add(new Backend.Models.UserPoints { UserId = u.Id, Points = 0 });
        u.Points = 0;

        if (u.Projects == null || !u.Projects.Any())
        {
            var p1 = new Backend.Models.Project
            {
                Name = "Website Redesign",
                Status = "In Progress",
                Hours = 40,
                HoursTrend = "+5%",
                Tasks = new List<Backend.Models.ProjectTask>
                {
                    new Backend.Models.ProjectTask { Title = "Design Mockups", Status = "Done", StatusClass = "completed" },
                    new Backend.Models.ProjectTask { Title = "Frontend Dev", Status = "In Progress", StatusClass = "in-progress" },
                    new Backend.Models.ProjectTask { Title = "Backend API", Status = "To Do", StatusClass = "todo" }
                }
            };
            var p2 = new Backend.Models.Project
            {
                Name = "Mobile App Launch",
                Status = "Completed",
                Hours = 120,
                HoursTrend = "-2%",
                Tasks = new List<Backend.Models.ProjectTask>
                {
                    new Backend.Models.ProjectTask { Title = "Beta Testing", Status = "Done", StatusClass = "completed" },
                    new Backend.Models.ProjectTask { Title = "App Store Submission", Status = "Done", StatusClass = "completed" }
                }
            };
            u.Projects = new List<Backend.Models.Project> { p1, p2 };
        }
    }
    context.SaveChanges();
}

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
