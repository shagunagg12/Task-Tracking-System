namespace Backend.DTOs
{
    public class CreateProjectDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        
        // Priority Task Details
        public string? PriorityTaskTitle { get; set; }
        public string? PriorityTaskDesc { get; set; }
        public string? PriorityTaskDue { get; set; }
        public string? PriorityTaskTimeRemaining { get; set; }
        public double? Hours { get; set; }
        public string? HoursTrend { get; set; }
        
        // Team Member
        public string? TeamMemberName { get; set; }
        
        // Deadline
        public string? DeadlineTitle { get; set; }
        public string? DeadlineDesc { get; set; }
        public string? DeadlineDay { get; set; }
        public string? DeadlineMonth { get; set; }
        public string? DeadlineColor { get; set; }
        
        // Feedback
        public string? FeedbackText { get; set; }
        public string? FeedbackAuthorName { get; set; }
    }

    public class CreateTaskDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class UpdateTaskStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public string StatusClass { get; set; } = string.Empty;
    }

    public class EditTaskDto
    {
        public string Title { get; set; } = string.Empty;
    }

    public class UpdateProjectDetailsDto
    {
        public string PriorityTaskTitle { get; set; } = string.Empty;
        public string PriorityTaskDesc { get; set; } = string.Empty;
        public string PriorityTaskDue { get; set; } = string.Empty;
        public string PriorityTaskTimeRemaining { get; set; } = string.Empty;
        public double Hours { get; set; }
        public string HoursTrend { get; set; } = string.Empty;
    }

    public class AddTeamMemberDto
    {
        public string Name { get; set; } = string.Empty;
    }

    public class AddDeadlineDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Day { get; set; } = string.Empty;
        public string Month { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
    }

    public class AddFeedbackDto
    {
        public string Text { get; set; } = string.Empty;
        public string AuthorName { get; set; } = string.Empty;
    }
}
