using System.Threading.Tasks;
using Backend.DTOs;

namespace Backend.Interfaces
{
    public interface IAdminDashboardService
    {
        Task<DashboardStatsDto> GetDashboardStatsAsync();
        Task<object> GetNotificationsAsync();
        Task<bool> MarkNotificationAsReadAsync(int id);
        Task MarkAllNotificationsAsReadAsync();
        Task<bool> DeleteNotificationAsync(int id);
    }
}
