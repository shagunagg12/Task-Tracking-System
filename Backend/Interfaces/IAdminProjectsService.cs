using System.Threading.Tasks;
using Backend.DTOs;
using Backend.Models;

namespace Backend.Interfaces
{
    public interface IAdminProjectsService
    {
        Task<object> GetUsersWithProjectsAsync();
        Task<Project> CreateProjectAsync(CreateProjectDto dto);
        Task<ProjectTask> CreateTaskAsync(int projectId, CreateTaskDto dto);
        Task<ProjectTask> UpdateTaskStatusAsync(int taskId, UpdateTaskStatusDto dto);
        Task<ProjectTask> EditTaskAsync(int taskId, EditTaskDto dto);
        Task<bool> DeleteTaskAsync(int taskId);
        Task<bool> DeleteProjectAsync(int projectId);
        Task<Project> UpdateProjectDetailsAsync(int projectId, UpdateProjectDetailsDto dto);
        Task<ProjectTeamMember> AddTeamMemberAsync(int projectId, AddTeamMemberDto dto);
        Task<bool> DeleteTeamMemberAsync(int projectId, int memberId);
        Task<ProjectDeadline> AddDeadlineAsync(int projectId, AddDeadlineDto dto);
        Task<ProjectFeedback> AddFeedbackAsync(int projectId, AddFeedbackDto dto);
    }
}
