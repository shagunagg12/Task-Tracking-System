using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Interfaces;
using System.Threading.Tasks;
using System;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public class SuperAdminsController : ControllerBase
    {
        private readonly ISuperAdminsService _superAdminsService;

        public SuperAdminsController(ISuperAdminsService superAdminsService)
        {
            _superAdminsService = superAdminsService;
        }

        [HttpGet]
        public async Task<IActionResult> GetSuperAdmins()
        {
            try
            {
                var result = await _superAdminsService.GetSuperAdminsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterSuperAdmin([FromBody] RegisterSuperAdminDto dto)
        {
            try
            {
                var result = await _superAdminsService.RegisterSuperAdminAsync(dto);
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
