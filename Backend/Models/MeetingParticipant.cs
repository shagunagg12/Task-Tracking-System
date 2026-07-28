using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class MeetingParticipant
    {
        [Key]
        public int Id { get; set; }

        public int MeetingId { get; set; }
        public Meeting Meeting { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }
    }
}
