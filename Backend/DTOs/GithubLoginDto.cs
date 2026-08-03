namespace Backend.DTOs
{
    public class GithubLoginDto
    {
        public string Code { get; set; } = string.Empty;
        public bool IsRegistering { get; set; }
    }
}
