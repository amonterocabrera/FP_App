using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using GestionElectoral.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace GestionElectoral.Infrastructure.Services
{


    public class N8nValidationService : IN8nValidationService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<N8nValidationService> _logger;

        public N8nValidationService(HttpClient httpClient, ILogger<N8nValidationService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<N8nValidationResponse> ValidateDocumentAsync(string cedula, string nombre, IFormFile file)
        {
            try
            {
                using var content = new MultipartFormDataContent();
                
                content.Add(new StringContent(cedula ?? string.Empty), "cedula");
                content.Add(new StringContent(nombre ?? string.Empty), "nombre");

                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var fileBytes = memoryStream.ToArray();
                var fileContent = new ByteArrayContent(fileBytes);
                
                if (!string.IsNullOrEmpty(file.ContentType))
                {
                    fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse(file.ContentType);
                }
                
                content.Add(fileContent, "imagen", file.FileName);

                var response = await _httpClient.PostAsync("https://n8n-n8n.kxv0d4.easypanel.host/webhook/validar-cedula", content);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Error HTTP llamando a n8n: {StatusCode}", response.StatusCode);
                    return new N8nValidationResponse { Success = false, Message = "El servicio de validación automática no respondió correctamente." };
                }

                var result = await response.Content.ReadFromJsonAsync<N8nValidationResponse>();
                return result ?? new N8nValidationResponse { Success = false, Message = "Respuesta vacía desde el nivel de seguridad." };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Excepción en el servicio de validación de identidad automatizada.");
                return new N8nValidationResponse { Success = false, Message = "Error interno durante la verificación del documento." };
            }
        }
    }
}
