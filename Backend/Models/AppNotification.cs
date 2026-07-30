using System;

namespace Backend.Models
{
    public class AppNotification
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public string Type { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsRead { get; set; }
        
        public int? ProjectId { get; set; }
        public int? TaskId { get; set; }
        public int? MeetingId { get; set; }

        public Project? Project { get; set; }
        public ProjectTask? Task { get; set; }
        public Meeting? Meeting { get; set; }
    }
}
