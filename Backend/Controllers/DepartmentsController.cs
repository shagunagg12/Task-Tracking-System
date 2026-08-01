using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Interfaces;
using System.Threading.Tasks;
using System;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentsController : ControllerBase
    {
        private readonly IDepartmentsService _departmentsService;

        public DepartmentsController(IDepartmentsService departmentsService)
        {
            _departmentsService = departmentsService;
        }

        [HttpGet]
        public async Task<IActionResult> GetDepartments()
        {
            try
            {
                var result = await _departmentsService.GetDepartmentsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet("with-users")]
        public async Task<IActionResult> GetDepartmentsWithUsers()
        {
            try
            {
                var result = await _departmentsService.GetDepartmentsWithUsersAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateDepartment([FromBody] Department model)
        {
            try
            {
                var result = await _departmentsService.CreateDepartmentAsync(model);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}
