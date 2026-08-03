using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatbotController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private static readonly Dictionary<string, string> BotSystemPrompts = new()
        {
            { "daksh", "You are Daksh, the Technical Lead & Code Expert for the 'Matts' platform. Help debug, write, or refactor code for Matts. Format code blocks using markdown. IMPORTANT: Keep replies ULTRA-SHORT, usually 1 sentence. Point-to-point small answers. STRICT RULE: You MUST politely decline ANY question about external companies (e.g., FAANG), outside projects, or general knowledge. Say: 'I can only assist with matters directly related to the Matts platform.'" },
            { "ayush", "You are Ayush, the HR Specialist & Team Lead for the 'Matts' platform. Focus on Matts team collaboration, workplace satisfaction, and HR policies. IMPORTANT: Keep replies ULTRA-SHORT, usually 1 sentence. Point-to-point small answers. STRICT RULE: You MUST politely decline ANY question about external companies, outside jobs, or general knowledge. Say: 'I can only assist with HR matters directly related to the Matts platform.'" },
            { "rachit", "You are Rachit, the Operations & Efficiency Optimizer for the 'Matts' platform. Help Matts users optimize schedules and workflows. IMPORTANT: Keep replies ULTRA-SHORT, usually 1 sentence. Point-to-point small answers. STRICT RULE: You MUST politely decline ANY question about external companies, outside workflows, or general knowledge. Say: 'I can only assist with operations directly related to the Matts platform.'" },
            { "kartik", "You are Kartik, the Mentorship & Skill Advisor for the 'Matts' platform. Guide users on learning paths and tech skills for their role at Matts. IMPORTANT: Keep replies ULTRA-SHORT, usually 1 sentence. Point-to-point small answers. STRICT RULE: You MUST politely decline ANY question about getting jobs at other companies (e.g., FAANG), outside career advice, or general knowledge. Say: 'I can only assist with skill development directly related to your role at the Matts platform.'" }
        };

        public ChatbotController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpPost("query")]
        public async Task<IActionResult> Query([FromBody] ChatbotQueryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Bot) || string.IsNullOrWhiteSpace(dto.Text))
            {
                return BadRequest(new { message = "Bot and Text fields are required." });
            }

            var apiKey = _configuration["GeminiApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? Environment.GetEnvironmentVariable("NVIDIA_API_KEY");
            if (string.IsNullOrEmpty(apiKey))
            {
                return StatusCode(500, new { message = "Gemini API Key is not configured in backend environment or appsettings." });
            }

            try
            {
                var systemPrompt = BotSystemPrompts.GetValueOrDefault(dto.Bot.ToLower(), "You are a helpful AI assistant.");
                
                var contents = new List<object>();

                // Add conversation history in Google Gemini's contents format
                if (dto.Messages != null && dto.Messages.Any())
                {
                    var recentMessages = dto.Messages.Skip(Math.Max(0, dto.Messages.Count - 10)).ToList();
                    foreach (var msg in recentMessages)
                    {
                        // Gemini roles must be "user" or "model" (not assistant)
                        string role = msg.Role.ToLower() == "assistant" ? "model" : "user";
                        contents.Add(new
                        {
                            role = role,
                            parts = new[] { new { text = msg.Content } }
                        });
                    }
                }
                else
                {
                    contents.Add(new
                    {
                        role = "user",
                        parts = new[] { new { text = dto.Text } }
                    });
                }

                var requestBody = new
                {
                    contents = contents,
                    systemInstruction = new
                    {
                        parts = new[] { new { text = systemPrompt } }
                    },
                    generationConfig = new
                    {
                        temperature = 0.7,
                        maxOutputTokens = 1024
                    }
                };

                var client = _httpClientFactory.CreateClient();
                // Google Gemini api endpoint (correct URL is /v1beta/models/... or /v1/models/...)
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={apiKey}";
                var request = new HttpRequestMessage(HttpMethod.Post, url);
                
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
                };
                
                request.Content = new StringContent(JsonSerializer.Serialize(requestBody, jsonOptions), Encoding.UTF8, "application/json");

                var response = await client.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return StatusCode((int)response.StatusCode, new { message = $"Gemini API returned error: {errorContent}" });
                }

                var responseString = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseString);
                var root = doc.RootElement;
                
                // Extract output text from Gemini response structure: candidates[0].content.parts[0].text
                var replyContent = root.GetProperty("candidates")[0]
                                      .GetProperty("content")
                                      .GetProperty("parts")[0]
                                      .GetProperty("text")
                                      .GetString();

                return Ok(new { reply = replyContent });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to query Gemini chatbot service.", error = ex.Message });
            }
        }
    }

    public class ChatbotQueryDto
    {
        public string Bot { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public List<ChatMessageDto> Messages { get; set; } = new();
    }

    public class ChatMessageDto
    {
        [JsonPropertyName("role")]
        public string Role { get; set; } = string.Empty;
        
        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
    }
}
