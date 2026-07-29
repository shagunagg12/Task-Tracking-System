using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class CreateEventRequest
    {
        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string Type { get; set; } = "Dinner";

        [Required]
        public DateTime EventDate { get; set; }

        public string Location { get; set; } = string.Empty;

        public int Points { get; set; } = 10;

        public List<int> InvitedUserIds { get; set; } = new List<int>();
    }
}
