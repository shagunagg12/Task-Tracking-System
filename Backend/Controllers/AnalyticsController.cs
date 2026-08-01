using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Interfaces;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;

        public AnalyticsController(IAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        [HttpGet("filters/departments")]
        public async Task<ActionResult<List<DepartmentFilterDto>>> GetDepartmentFilters()
        {
            var result = await _analyticsService.GetDepartmentFiltersAsync();
            return Ok(result);
        }

        [HttpGet("filters/users")]
        public async Task<ActionResult<List<UserFilterDto>>> GetUserFilters()
        {
            var result = await _analyticsService.GetUserFiltersAsync();
            return Ok(result);
        }

        [HttpGet("organization")]
        public async Task<ActionResult<OrganizationAnalyticsDto>> GetOrganizationAnalytics()
        {
            var result = await _analyticsService.GetOrganizationAnalyticsAsync();
            return Ok(result);
        }

        [HttpGet("department/{departmentName}")]
        public async Task<ActionResult<DepartmentAnalyticsDto>> GetDepartmentAnalytics(string departmentName)
        {
            try
            {
                var result = await _analyticsService.GetDepartmentAnalyticsAsync(departmentName);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<UserAnalyticsDto>> GetUserAnalytics(int userId)
        {
            try
            {
                var result = await _analyticsService.GetUserAnalyticsAsync(userId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
