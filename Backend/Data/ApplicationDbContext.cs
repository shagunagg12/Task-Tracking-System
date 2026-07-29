using Microsoft.EntityFrameworkCore;

using Backend.Models;

namespace Backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Admin> Admins { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<UserProfile> Profiles { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectTask> ProjectTasks { get; set; }
        public DbSet<ProjectDeadline> ProjectDeadlines { get; set; }
        public DbSet<ProjectFeedback> ProjectFeedbacks { get; set; }
        public DbSet<ProjectTeamMember> ProjectTeamMembers { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<AppNotification> AppNotifications { get; set; }
        public DbSet<UserNotification> UserNotifications { get; set; }
        public DbSet<DepartmentAnnouncement> DepartmentAnnouncements { get; set; }
        public DbSet<ProjectMessage> ProjectMessages { get; set; }
        public DbSet<Meeting> Meetings { get; set; }
        public DbSet<MeetingParticipant> MeetingParticipants { get; set; }

        public DbSet<SuperAdmin> SuperAdmins { get; set; }
        public DbSet<Department> Departments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<SuperAdmin>().HasData(
                new SuperAdmin
                {
                    Id = 1,
                    Email = "connect2rachit882@gmail.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Rachit@12"),
                    FullName = "Rachit"
                }
            );

            modelBuilder.Entity<Department>().HasData(
                new Department { Id = 1, Name = "Engineering" },
                new Department { Id = 2, Name = "Marketing" },
                new Department { Id = 3, Name = "Sales" },
                new Department { Id = 4, Name = "Human Resources" },
                new Department { Id = 5, Name = "Product" }
            );

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasOne(u => u.Profile)
                .WithOne(p => p.User)
                .HasForeignKey<UserProfile>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Projects)
                .WithOne(p => p.User)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Project>()
                .HasMany(p => p.Tasks)
                .WithOne(t => t.Project)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Project>()
                .HasMany(p => p.Deadlines)
                .WithOne(d => d.Project)
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Project>()
                .HasMany(p => p.Feedbacks)
                .WithOne(f => f.Project)
                .HasForeignKey(f => f.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Project>()
                .HasMany(p => p.TeamMembers)
                .WithOne(tm => tm.Project)
                .HasForeignKey(tm => tm.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProjectTeamMember>()
                .HasOne(tm => tm.User)
                .WithMany()
                .HasForeignKey(tm => tm.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany()
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure AppNotification Foreign Keys
            modelBuilder.Entity<AppNotification>()
                .HasOne(n => n.Project)
                .WithMany()
                .HasForeignKey(n => n.ProjectId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<AppNotification>()
                .HasOne(n => n.Task)
                .WithMany()
                .HasForeignKey(n => n.TaskId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<AppNotification>()
                .HasOne(n => n.Meeting)
                .WithMany()
                .HasForeignKey(n => n.MeetingId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ProjectMessage>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ProjectMessage>()
                .HasOne(m => m.Project)
                .WithMany()
                .HasForeignKey(m => m.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Meeting>()
                .HasOne(m => m.Organizer)
                .WithMany() 
                .HasForeignKey(m => m.OrganizerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Meeting>()
                .HasMany(m => m.Participants)
                .WithOne(mp => mp.Meeting)
                .HasForeignKey(mp => mp.MeetingId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MeetingParticipant>()
                .HasOne(mp => mp.User)
                .WithMany()
                .HasForeignKey(mp => mp.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
