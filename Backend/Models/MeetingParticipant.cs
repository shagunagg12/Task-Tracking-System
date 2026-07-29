namespace Backend.Models
{
    public class MeetingParticipant
    {
        public int Id { get; set; }
        public int MeetingId { get; set; }
        public int UserId { get; set; }
    }
}
