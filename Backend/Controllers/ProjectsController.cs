using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Interfaces;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly IProjectsService _projectsService;

        public ProjectsController(IProjectsService projectsService)
        {
            _projectsService = projectsService;
        }

        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            try
            {
                var result = await _projectsService.GetProjectsAsync(User);
                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
        }

        [HttpPatch("tasks/{taskId}/status")]
        public async Task<IActionResult> UpdateTaskStatus(int taskId, [FromBody] UpdateTaskStatusRequest request)
        {
            try
            {
                var result = await _projectsService.UpdateTaskStatusAsync(User, taskId, request);
                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPatch("{projectId}/status")]
        public async Task<IActionResult> UpdateProjectStatus(int projectId, [FromBody] UpdateProjectStatusRequest request)
        {
            try
            {
                var result = await _projectsService.UpdateProjectStatusAsync(User, projectId, request);
                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpPost("seed-dummy-data")]
        public async Task<IActionResult> SeedDummyData()
        {
            try
            {
                var result = await _projectsService.SeedDummyDataAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
