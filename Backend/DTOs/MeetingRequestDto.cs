using System.Collections.Generic;

namespace Backend.DTOs
{
    public class MeetingRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public string Brief { get; set; } = string.Empty;
        public string StartDate { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndDate { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public List<ParticipantDto> Participants { get; set; } = new List<ParticipantDto>();
    }
}
