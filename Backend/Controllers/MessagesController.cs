using Microsoft.AspNetCore.Mvc;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly IMessagesService _messagesService;

        public MessagesController(IMessagesService messagesService)
        {
            _messagesService = messagesService;
        }

        [HttpGet("history/{otherUserId}")]
        public async Task<IActionResult> GetChatHistory(int otherUserId)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int currentUserId))
            {
                return Unauthorized();
            }

            var result = await _messagesService.GetChatHistoryAsync(currentUserId, otherUserId);
            return Ok(result);
        }

        [HttpPut("mark-read/{senderId}")]
        public async Task<IActionResult> MarkMessagesAsRead(int senderId)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int currentUserId))
            {
                return Unauthorized();
            }

            await _messagesService.MarkMessagesAsReadAsync(currentUserId, senderId);
            return Ok();
        }

        [HttpGet("project-history/{projectId}")]
        public async Task<IActionResult> GetProjectChatHistory(int projectId)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int currentUserId))
            {
                return Unauthorized();
            }

            var result = await _messagesService.GetProjectChatHistoryAsync(currentUserId, projectId);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMessage(int id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int currentUserId)) return Unauthorized();

            try
            {
                await _messagesService.DeleteMessageAsync(currentUserId, id);
                return Ok();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpDelete("project/{id}")]
        public async Task<IActionResult> DeleteProjectMessage(int id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int currentUserId)) return Unauthorized();

            try
            {
                await _messagesService.DeleteProjectMessageAsync(currentUserId, id);
                return Ok();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}
