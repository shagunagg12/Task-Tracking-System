using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class ChatMessage
    {
        public int Id { get; set; }
        
        public int ChatSessionId { get; set; }
        public ChatSession? ChatSession { get; set; }

        public int SenderId { get; set; }
        public User? Sender { get; set; }

        public string Text { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
