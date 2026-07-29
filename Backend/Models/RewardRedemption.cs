using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class RewardRedemption
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("UserId")]
        public int UserId { get; set; }

        [Column("RewardId")]
        public string RewardId { get; set; } = string.Empty;

        [Column("Title")]
        public string Title { get; set; } = string.Empty;

        [Column("PointsSpent")]
        public int PointsSpent { get; set; }

        [Column("RedeemedAt")]
        public DateTime RedeemedAt { get; set; } = DateTime.UtcNow;

        [Column("Status")]
        public string Status { get; set; } = "Pending";
    }
}
