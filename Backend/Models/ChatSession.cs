using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class ChatSession
    {
        public int Id { get; set; }
        
        public string? Name { get; set; }
        public bool IsGroupChat { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public ICollection<ChatSessionMember> Members { get; set; } = new List<ChatSessionMember>();
        public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }
}
