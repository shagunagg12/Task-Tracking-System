namespace Backend.Models
{
    public class ProjectDeadline
    {
        public int Id { get; set; }

        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        public string Day { get; set; } = string.Empty;
        public string Month { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
    }
}
