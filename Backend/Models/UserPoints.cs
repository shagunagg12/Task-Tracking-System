using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("UserPoints")]
    public class UserPoints
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("UserId")]
        public int UserId { get; set; }

        [Column("Points")]
        public int Points { get; set; }
    }
}
