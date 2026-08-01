namespace Backend.DTOs
{
    public class ClaimBonusRequest
    {
        public string BonusId { get; set; } = string.Empty;
        public int RewardPoints { get; set; }
    }
}
