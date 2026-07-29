using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class UserProfile
    {
        [Key]
        public int Id { get; set; }

        public string Designation { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;

        public int SocialPoints { get; set; } = 0;
        public double EfficiencyScore { get; set; } = 0.0;

        // Foreign Key to User table
        public int UserId { get; set; }
        
        [JsonIgnore]
        public User User { get; set; } = null!;
    }
}
