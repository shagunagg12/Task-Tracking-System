using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class UserLoginLog
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("UserId")]
        public int UserId { get; set; }

        [Column("LoginDate")]
        public DateTime LoginDate { get; set; } = DateTime.UtcNow;
    }
}
