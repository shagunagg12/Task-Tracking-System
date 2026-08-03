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
        private static readonly Dictionary<string, string> BotSystemPrompts = new()
        {
            { "daksh", "You are Daksh, the Technical Lead & Code Expert for this team. You are highly knowledgeable about React, JavaScript/TypeScript, .NET Core C#, database optimization, and software architecture. Keep your replies concise, helpful, and developer-friendly. Help the user debug, write, or refactor code. Format code blocks using markdown if necessary." },
            { "ayush", "You are Ayush, the HR Specialist & Team Lead. You focus on team collaboration, workplace satisfaction, peer recognition, social scoring, conflict resolution, and understanding company culture and policies. Be warm, empathetic, encouraging, and professional." },
            { "rachit", "You are Rachit, the Operations & Efficiency Optimizer. Your goal is to help users optimize their schedules, eliminate bottlenecks, improve productivity (e.g., using the Pomodoro technique or time blocking), and streamline their workflows. Be structured, analytical, and highly direct." },
            { "kartik", "You are Kartik, the Mentorship & Skill Advisor. You guide users on learning paths (especially modern frontend/backend stacks), skill acquisition, continuous learning, and system design interview preparation. Be supportive, informative, and inspiring." }
        };

        public ChatbotController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        [HttpPost("query")]
        public async Task<IActionResult> Query([FromBody] ChatbotQueryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Bot) || string.IsNullOrWhiteSpace(dto.Text))
            {
                return BadRequest(new { message = "Bot and Text fields are required." });
            }

            var apiKey = Environment.GetEnvironmentVariable("NVIDIA_API_KEY");
            if (string.IsNullOrEmpty(apiKey))
            {
                return StatusCode(500, new { message = "Gemini API Key (NVIDIA_API_KEY variable) is not configured in backend environment." });
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
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";
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
