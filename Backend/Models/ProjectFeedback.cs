namespace Backend.Models
{
    public class ProjectFeedback
    {
        public int Id { get; set; }

        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        public string Text { get; set; } = string.Empty;
        public string AuthorName { get; set; } = string.Empty;
        public string AuthorImage { get; set; } = string.Empty;
    }
}
