using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class UserClaimedBonus
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("UserId")]
        public int UserId { get; set; }

        [Column("BonusId")]
        public string BonusId { get; set; } = string.Empty;

        [Column("ClaimedAt")]
        public DateTime ClaimedAt { get; set; } = DateTime.UtcNow;
    }
}
