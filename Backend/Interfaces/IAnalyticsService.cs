using System.Collections.Generic;
using System.Threading.Tasks;
using Backend.Models;

namespace Backend.Interfaces
{
    public interface IAnalyticsService
    {
        Task<List<DepartmentFilterDto>> GetDepartmentFiltersAsync();
        Task<List<UserFilterDto>> GetUserFiltersAsync();
        Task<OrganizationAnalyticsDto> GetOrganizationAnalyticsAsync();
        Task<DepartmentAnalyticsDto> GetDepartmentAnalyticsAsync(string departmentName);
        Task<UserAnalyticsDto> GetUserAnalyticsAsync(int userId);
    }
}
