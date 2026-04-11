using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace GestionElectoral.Application.Common.Interfaces
{
    public class N8nValidationResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public interface IN8nValidationService
    {
        Task<N8nValidationResponse> ValidateDocumentAsync(string cedula, string nombre, IFormFile file);
    }
}
