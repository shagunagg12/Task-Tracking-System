using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class ProjectTeamMember
    {
        public int Id { get; set; }

        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        public int? UserId { get; set; }
        [ForeignKey("UserId")]
        public User? User { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Image { get; set; } = string.Empty;
    }
}
