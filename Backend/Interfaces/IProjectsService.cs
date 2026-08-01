using System.Threading.Tasks;
using Backend.Models;
using System.Security.Claims;

namespace Backend.Interfaces
{
    public interface IProjectsService
    {
        Task<object> GetProjectsAsync(ClaimsPrincipal user);
        Task<object> UpdateTaskStatusAsync(ClaimsPrincipal user, int taskId, UpdateTaskStatusRequest request);
        Task<object> UpdateProjectStatusAsync(ClaimsPrincipal user, int projectId, UpdateProjectStatusRequest request);
        Task<object> SeedDummyDataAsync();
    }
}
