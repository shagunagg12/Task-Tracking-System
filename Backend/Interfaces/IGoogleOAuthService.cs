using System.Threading.Tasks;
using System.Security.Claims;

namespace Backend.Interfaces
{
    public interface IGoogleOAuthService
    {
        string GetLoginUrl(ClaimsPrincipal user);
        Task<bool> GetStatusAsync();
        Task CallbackAsync(string code, string state);
    }
}
