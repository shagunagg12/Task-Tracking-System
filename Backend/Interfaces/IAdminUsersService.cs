using System.Threading.Tasks;
using Backend.DTOs;

namespace Backend.Interfaces
{
    public interface IAdminUsersService
    {
        Task<object> GetUsersAsync();
        Task<bool> PromoteToAdminAsync(int id);
        Task<bool> DemoteFromAdminAsync(int id);
        Task<object> CreateUserAsync(CreateUserDto dto);
        Task<object> UpdateUserAsync(int id, UpdateUserDto dto);
        Task<bool> DeleteUserAsync(int id);
        Task<object> ToggleUserStatusAsync(int id);
        Task<object> GetUserInsightsAsync(int id);
    }
}
