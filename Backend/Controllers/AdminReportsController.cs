using Microsoft.AspNetCore.Mvc;
using Backend.Interfaces;
using System.Threading.Tasks;
using System;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminReportsController : ControllerBase
    {
        private readonly IAdminReportsService _adminReportsService;

        public AdminReportsController(IAdminReportsService adminReportsService)
        {
            _adminReportsService = adminReportsService;
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
            try
            {
                var result = await _adminReportsService.GetOverviewAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}
