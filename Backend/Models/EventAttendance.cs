using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class EventAttendance
    {
        [Key]
        public int Id { get; set; }

        public int EventId { get; set; }
        
        [ForeignKey("EventId")]
        [JsonIgnore]
        public CompanyEvent Event { get; set; } = null!;

        public int UserId { get; set; }
        
        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        public string Status { get; set; } = "Going"; // Going, Maybe, Declined
        
        public bool IsAttended { get; set; } = false; // Verified attendance
    }
}
