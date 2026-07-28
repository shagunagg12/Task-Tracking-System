using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class ChatSessionMember
    {
        public int Id { get; set; }
        
        public int ChatSessionId { get; set; }
        public ChatSession? ChatSession { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }
        
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}
