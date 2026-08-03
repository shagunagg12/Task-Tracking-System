using System.Threading.Tasks;

namespace Backend.Interfaces
{
    public interface IStandingsService
    {
        Task<object> GetSocialStandingsAsync(string timeframe);
        Task<object> GetEfficiencyStandingsAsync();
        Task<object> GetMySocialDashboardAsync(int currentUserId);
    }
}
