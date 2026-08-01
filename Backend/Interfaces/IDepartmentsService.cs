using System.Threading.Tasks;
using Backend.Models;

namespace Backend.Interfaces
{
    public interface IDepartmentsService
    {
        Task<object> GetDepartmentsAsync();
        Task<object> GetDepartmentsWithUsersAsync();
        Task<object> CreateDepartmentAsync(Department model);
    }
}
