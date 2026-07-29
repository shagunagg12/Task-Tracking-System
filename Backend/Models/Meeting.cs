using System.Collections.Generic;

namespace Backend.Models
{
    public class Meeting
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Brief { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string MeetLink { get; set; } = string.Empty;
        public int OrganizerId { get; set; }
        public User? Organizer { get; set; }
        public ICollection<MeetingParticipant> Participants { get; set; } = new List<MeetingParticipant>();
    }
}
