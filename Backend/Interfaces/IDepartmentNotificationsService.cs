using System.Threading.Tasks;
using Backend.DTOs;

namespace Backend.Interfaces
{
    public interface IDepartmentNotificationsService
    {
        Task<object> NotifyDepartmentAsync(string departmentName, NotifyRequest request);
        Task<object> GetDepartmentAnnouncementsAsync(string departmentName);
        Task<object> UpdateAnnouncementAsync(int id, NotifyRequest request);
        Task DeleteAnnouncementAsync(int id);
        Task<object> GetUserNotificationsAsync(int userId);
    }
}
