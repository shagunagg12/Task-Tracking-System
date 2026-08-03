using System.Security.Claims;
using System.Threading.Tasks;
using Backend.DTOs;
using Microsoft.AspNetCore.Http;

namespace Backend.Interfaces
{
    public interface IProfileService
    {
        Task<object> GetProfileAsync(ClaimsPrincipal user, int userId);
        Task<object> GetDepartmentMembersAsync(ClaimsPrincipal user, int userId);
        Task<object> UpdateProfileAsync(ClaimsPrincipal user, int userId, UpdateProfileDto dto);
        Task<object> UploadProfilePictureAsync(ClaimsPrincipal user, int userId, IFormFile file);
    }
}
