using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class DepartmentAnnouncement
    {
        public int Id { get; set; }
        
        [Required]
        public string DepartmentName { get; set; } = string.Empty;
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Message { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
