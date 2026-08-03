using System.Threading.Tasks;
using Backend.DTOs;
using Backend.Models;

namespace Backend.Interfaces
{
    public interface IEventsService
    {
        Task<object> GetEventsAsync(int currentUserId);
        Task<CompanyEvent> CreateEventAsync(int currentUserId, CreateEventRequest request);
        Task<object> RsvpEventAsync(int currentUserId, int eventId, RsvpRequest request);
        Task<bool> RsvpViaEmailAsync(int eventId, int userId, string status, string signature);
    }
}
