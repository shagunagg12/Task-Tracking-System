using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Interfaces;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminUsersController : ControllerBase
    {
        private readonly IAdminUsersService _adminUsersService;

        public AdminUsersController(IAdminUsersService adminUsersService)
        {
            _adminUsersService = adminUsersService;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _adminUsersService.GetUsersAsync();
            return Ok(users);
        }

        [HttpPost("{id}/promote")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> PromoteToAdmin(int id)
        {
            try
            {
                await _adminUsersService.PromoteToAdminAsync(id);
                return Ok(new { message = "User successfully promoted to Admin" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/demote")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> DemoteFromAdmin(int id)
        {
            try
            {
                await _adminUsersService.DemoteFromAdminAsync(id);
                return Ok(new { message = "User successfully demoted to Employee" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            try
            {
                var result = await _adminUsersService.CreateUserAsync(dto);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
        {
            try
            {
                var result = await _adminUsersService.UpdateUserAsync(id, dto);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var success = await _adminUsersService.DeleteUserAsync(id);
            if (!success) return NotFound();
            return Ok(new { message = "User deleted successfully" });
        }

        [HttpPut("{id}/toggle-status")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> ToggleUserStatus(int id)
        {
            try
            {
                var result = await _adminUsersService.ToggleUserStatusAsync(id);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("{id}/insights")]
        public async Task<IActionResult> GetUserInsights(int id)
        {
            try
            {
                var result = await _adminUsersService.GetUserInsightsAsync(id);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
