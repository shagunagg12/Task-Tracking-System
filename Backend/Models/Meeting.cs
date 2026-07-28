using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Meeting
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        public string Brief { get; set; }

        [Required]
        public DateTime StartTime { get; set; }

        [Required]
        public DateTime EndTime { get; set; }

        public string MeetLink { get; set; }

        public int OrganizerId { get; set; }
        public User Organizer { get; set; }

        public ICollection<MeetingParticipant> Participants { get; set; } = new List<MeetingParticipant>();
    }
}
