using System.Threading.Tasks;

namespace Backend.Interfaces
{
    public interface IAdminReportsService
    {
        Task<object> GetOverviewAsync();
    }
}
