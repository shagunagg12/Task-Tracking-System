using Backend.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using System;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class UploadService : IUploadService
    {
        private readonly Cloudinary _cloudinary;

        public UploadService()
        {
            var cloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");
            var apiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");
            var apiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");

            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(account);
        }

        public async Task<object> UploadFileAsync(IFormFile file, string fileType)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("No file uploaded.");

            using var stream = file.OpenReadStream();

            if (fileType == "audio" || fileType == "video")
            {
                var videoParams = new VideoUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "chat_audio"
                };
                var result = await _cloudinary.UploadAsync(videoParams);
                return new { url = result.SecureUrl.ToString(), type = fileType };
            }
            else if (fileType == "image")
            {
                var imageParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "chat_images"
                };
                var result = await _cloudinary.UploadAsync(imageParams);
                return new { url = result.SecureUrl.ToString(), type = fileType };
            }
            else
            {
                var rawParams = new RawUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "chat_files"
                };
                var result = await _cloudinary.UploadAsync(rawParams);
                return new { url = result.SecureUrl.ToString(), type = "raw" };
            }
        }
    }
}
