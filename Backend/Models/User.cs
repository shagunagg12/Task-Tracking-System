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

        // Navigation property
        public UserProfile? Profile { get; set; }
    }
}
