using System.Threading.Tasks;

namespace Backend.Interfaces
{
    public interface IMessagesService
    {
        Task<object> GetChatHistoryAsync(int currentUserId, int otherUserId);
        Task MarkMessagesAsReadAsync(int currentUserId, int senderId);
        Task<object> GetProjectChatHistoryAsync(int currentUserId, int projectId);
        Task DeleteMessageAsync(int currentUserId, int id);
        Task DeleteProjectMessageAsync(int currentUserId, int id);
    }
}
