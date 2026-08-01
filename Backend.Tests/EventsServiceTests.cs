using Backend.Data;
using Backend.Models;
using Backend.Services;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;
using Microsoft.AspNetCore.SignalR;
using Backend.Hubs;
using Backend.DTOs;

namespace Backend.Tests
{
    public class EventsServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly IOptions<AppSettings> _appSettings;
        private readonly EventsService _eventsService;

        public EventsServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);

            _mockEmailService = new Mock<IEmailService>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            _appSettings = Options.Create(new AppSettings
            {
                BackendUrl = "http://localhost:5024",
                RsvpSecretKey = "TestSecretKey"
            });

            _eventsService = new EventsService(_context, _mockEmailService.Object, _mockHubContext.Object, _appSettings);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Fact]
        public async Task CreateEventAsync_ShouldCreateEventAndAddPoints()
        {
            // Arrange
            var currentUserId = 1;
            var user = new User { Id = currentUserId, FullName = "Organizer", Email = "org@test.com" };
            var profile = new UserProfile { UserId = currentUserId, SocialPoints = 10 };
            
            _context.Users.Add(user);
            _context.Profiles.Add(profile);
            await _context.SaveChangesAsync();

            var request = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "A fun event",
                Type = "Social",
                EventDate = DateTime.UtcNow.AddDays(1),
                DurationHours = 2,
                Location = "Office",
                Points = 20,
                InvitedUserIds = new List<int>()
            };

            // Act
            var result = await _eventsService.CreateEventAsync(currentUserId, request);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Test Event", result.Title);
            
            var updatedProfile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == currentUserId);
            Assert.NotNull(updatedProfile);
            Assert.Equal(60, updatedProfile.SocialPoints); // 10 base + 50 for creating event
        }
    }
}
