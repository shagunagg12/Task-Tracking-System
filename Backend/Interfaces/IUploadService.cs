using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace Backend.Interfaces
{
    public interface IUploadService
    {
        Task<object> UploadFileAsync(IFormFile file, string fileType);
    }
}
