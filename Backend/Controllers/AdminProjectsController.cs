using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Interfaces;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminProjectsController : ControllerBase
    {
        private readonly IAdminProjectsService _adminProjectsService;

        public AdminProjectsController(IAdminProjectsService adminProjectsService)
        {
            _adminProjectsService = adminProjectsService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsersWithProjects()
        {
            var users = await _adminProjectsService.GetUsersWithProjectsAsync();
            return Ok(users);
        }

        [HttpPost]
        public async Task<IActionResult> CreateProject([FromBody] CreateProjectDto dto)
        {
            try
            {
                var project = await _adminProjectsService.CreateProjectAsync(dto);
                return Ok(project);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost("{projectId}/tasks")]
        public async Task<IActionResult> CreateTask(int projectId, [FromBody] CreateTaskDto dto)
        {
            try
            {
                var task = await _adminProjectsService.CreateTaskAsync(projectId, dto);
                return Ok(new { task.Id, task.Title, task.Description, task.Status, task.StatusClass });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPatch("tasks/{taskId}/status")]
        public async Task<IActionResult> UpdateTaskStatus(int taskId, [FromBody] UpdateTaskStatusDto dto)
        {
            try
            {
                var task = await _adminProjectsService.UpdateTaskStatusAsync(taskId, dto);
                return Ok(task);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPut("tasks/{taskId}")]
        public async Task<IActionResult> EditTask(int taskId, [FromBody] EditTaskDto dto)
        {
            try
            {
                var task = await _adminProjectsService.EditTaskAsync(taskId, dto);
                return Ok(task);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("tasks/{taskId}")]
        public async Task<IActionResult> DeleteTask(int taskId)
        {
            var success = await _adminProjectsService.DeleteTaskAsync(taskId);
            if (!success) return NotFound("Task not found");
            return Ok();
        }

        [HttpDelete("{projectId}")]
        public async Task<IActionResult> DeleteProject(int projectId)
        {
            var success = await _adminProjectsService.DeleteProjectAsync(projectId);
            if (!success) return NotFound("Project not found");
            return Ok();
        }

        [HttpPatch("{projectId}/details")]
        public async Task<IActionResult> UpdateProjectDetails(int projectId, [FromBody] UpdateProjectDetailsDto dto)
        {
            try
            {
                var project = await _adminProjectsService.UpdateProjectDetailsAsync(projectId, dto);
                return Ok(new { message = "Project details updated", project });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost("{projectId}/team-members")]
        public async Task<IActionResult> AddTeamMember(int projectId, [FromBody] AddTeamMemberDto dto)
        {
            try
            {
                var member = await _adminProjectsService.AddTeamMemberAsync(projectId, dto);
                return Ok(member);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("{projectId}/team-members/{memberId}")]
        public async Task<IActionResult> DeleteTeamMember(int projectId, int memberId)
        {
            var success = await _adminProjectsService.DeleteTeamMemberAsync(projectId, memberId);
            if (!success) return NotFound("Member not found");
            return Ok();
        }

        [HttpPost("{projectId}/deadlines")]
        public async Task<IActionResult> AddDeadline(int projectId, [FromBody] AddDeadlineDto dto)
        {
            try
            {
                var deadline = await _adminProjectsService.AddDeadlineAsync(projectId, dto);
                return Ok(deadline);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost("{projectId}/feedback")]
        public async Task<IActionResult> AddFeedback(int projectId, [FromBody] AddFeedbackDto dto)
        {
            try
            {
                var feedback = await _adminProjectsService.AddFeedbackAsync(projectId, dto);
                return Ok(feedback);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
