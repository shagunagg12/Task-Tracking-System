using System.Security.Claims;
using System.Threading.Tasks;
using Backend.DTOs;

namespace Backend.Interfaces
{
    public interface IRewardsService
    {
        Task<object> GetStatusAsync(ClaimsPrincipal userPrincipal, int userId);
        Task<object> ClaimBonusAsync(ClaimsPrincipal userPrincipal, int userId, ClaimBonusRequest request);
        Task<object> RedeemRewardAsync(ClaimsPrincipal userPrincipal, int userId, RedeemRewardRequest request);
    }
}
