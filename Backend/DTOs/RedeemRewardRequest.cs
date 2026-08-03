namespace Backend.DTOs
{
    public class RedeemRewardRequest
    {
        public string RewardId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int Points { get; set; }
    }
}
