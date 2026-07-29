using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Admin
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public string? ProfilePictureUrl { get; set; }

        public string FullName { get; set; } = "Admin";
        public string Designation { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
    }
}
