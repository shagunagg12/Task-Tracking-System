namespace Backend.Models
{
    public class AppSettings
    {
        public string FrontendUrl { get; set; } = string.Empty;
        public string BackendUrl { get; set; } = string.Empty;
        public string JwtSecretFallback { get; set; } = string.Empty;
        public string RsvpSecretKey { get; set; } = string.Empty;
    }
}
