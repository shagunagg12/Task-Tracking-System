using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class SuperAdmin
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public string FullName { get; set; } = "Super Admin";
        
        public string? ProfilePictureUrl { get; set; }
    }
}
