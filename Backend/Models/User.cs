using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class User
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("FullName")]
        public string FullName { get; set; } = string.Empty;

        [Column("EmailAddress")]
        public string Email { get; set; } = string.Empty;

        [Column("Password")]
        public string PasswordHash { get; set; } = string.Empty;

        public string? GoogleAccessToken { get; set; }
        public string? GoogleRefreshToken { get; set; }
        
        [Column("ProfilePictureUrl")]
        public string? ProfilePictureUrl { get; set; }

        [Column("Points")]
        public int Points { get; set; } = 1250;

        // Navigation property
        public UserProfile? Profile { get; set; }
        public ICollection<Project> Projects { get; set; } = new List<Project>();
    }
}
