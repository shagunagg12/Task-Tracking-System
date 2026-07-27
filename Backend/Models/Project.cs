using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Project
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }

        public string Name { get; set; } = string.Empty;

        // Priority Task details
        public string PriorityTaskTitle { get; set; } = string.Empty;
        public string PriorityTaskDesc { get; set; } = string.Empty;
        public string PriorityTaskDue { get; set; } = string.Empty;
        public string PriorityTaskTimeRemaining { get; set; } = string.Empty;

        public int Progress { get; set; }
        public double Hours { get; set; }
        public string HoursTrend { get; set; } = string.Empty;

        // Navigation Properties
        public ICollection<ProjectTask> Tasks { get; set; } = new List<ProjectTask>();
        public ICollection<ProjectDeadline> Deadlines { get; set; } = new List<ProjectDeadline>();
        public ICollection<ProjectFeedback> Feedbacks { get; set; } = new List<ProjectFeedback>();
        public ICollection<ProjectTeamMember> TeamMembers { get; set; } = new List<ProjectTeamMember>();
    }
}
