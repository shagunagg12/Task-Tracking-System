using System.Threading.Tasks;
using Backend.DTOs;

namespace Backend.Interfaces
{
    public interface IAuthService
    {
        Task<object> RegisterAsync(RegisterDto dto);
        Task<object> LoginAsync(LoginDto dto);
        Task<object> GoogleLoginAsync(GoogleLoginDto dto);
    }
}
