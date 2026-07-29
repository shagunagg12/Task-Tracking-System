using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UploadController : ControllerBase
    {
        private readonly Cloudinary _cloudinary;

        public UploadController()
        {
            var cloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");
            var apiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");
            var apiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");

            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(account);
        }

        [HttpPost]
        public async Task<IActionResult> UploadFile(IFormFile file, [FromForm] string fileType)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            using var stream = file.OpenReadStream();

            if (fileType == "audio" || fileType == "video")
            {
                var videoParams = new VideoUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "chat_audio"
                };
                var result = await _cloudinary.UploadAsync(videoParams);
                return Ok(new { url = result.SecureUrl.ToString(), type = fileType });
            }
            else if (fileType == "image")
            {
                var imageParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "chat_images"
                };
                var result = await _cloudinary.UploadAsync(imageParams);
                return Ok(new { url = result.SecureUrl.ToString(), type = fileType });
            }
            else
            {
                // Raw files like pdf, docx, zip, etc.
                var rawParams = new RawUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "chat_files"
                };
                var result = await _cloudinary.UploadAsync(rawParams);
                return Ok(new { url = result.SecureUrl.ToString(), type = "raw" });
            }
        }
    }
}
