using System.Threading.Tasks;
using Backend.DTOs;
using System.Collections.Generic;

namespace Backend.Interfaces
{
    public interface ISuperAdminsService
    {
        Task<object> GetSuperAdminsAsync();
        Task<object> RegisterSuperAdminAsync(RegisterSuperAdminDto dto);
    }
}
