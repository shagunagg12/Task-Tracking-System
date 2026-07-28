using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class ProjectMessage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SenderId { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty;

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public string? FileUrl { get; set; }

        public string? FileType { get; set; }

        public int? ReplyToMessageId { get; set; }

        [ForeignKey("SenderId")]
        public User? Sender { get; set; }

        [ForeignKey("ProjectId")]
        public Project? Project { get; set; }
    }
}
