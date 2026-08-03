using System.Threading.Tasks;
using Backend.DTOs;
using System.Security.Claims;
using System.Collections.Generic;

namespace Backend.Interfaces
{
    public interface IMeetingsService
    {
        Task<object> CreateMeetingAsync(ClaimsPrincipal user, MeetingRequestDto request);
        Task<object> GetMeetingsAsync(ClaimsPrincipal user);
    }
}
