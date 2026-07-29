using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class CompanyEvent
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string Type { get; set; } = "Dinner"; // e.g. Dinner, Workshop, Outing, Celebration

        [Required]
        public DateTime EventDate { get; set; }

        public string Location { get; set; } = string.Empty;

        public int Points { get; set; } = 10; // Points awarded for attending

        public int OrganizerId { get; set; }

        [ForeignKey("OrganizerId")]
        [JsonIgnore]
        public User Organizer { get; set; } = null!;

        public ICollection<EventAttendance> Attendees { get; set; } = new List<EventAttendance>();
    }
}
