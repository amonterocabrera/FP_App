using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using GestionElectoral.Application.Common.Interfaces;
using GestionElectoral.Domain.Entities.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace GestionElectoral.WebAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class IdentityValidationController : ControllerBase
    {
        private readonly IN8nValidationService _n8nValidationService;
        private readonly UserManager<ApplicationUser> _userManager;

        public IdentityValidationController(IN8nValidationService n8nValidationService, UserManager<ApplicationUser> userManager)
        {
            _n8nValidationService = n8nValidationService;
            _userManager = userManager;
        }

        [HttpPost("verify")]
        public async Task<IActionResult> VerifyIdentity([FromForm] IdentityValidationRequestDto request)
        {
            if (request.DocumentImage == null || request.DocumentImage.Length == 0)
                return BadRequest(new { message = "Debe adjuntar una imagen válida del documento." });

            var allowedTypes = new[] { "image/jpeg", "image/png" };
            if (!allowedTypes.Contains(request.DocumentImage.ContentType))
                return BadRequest(new { message = "Solo se permiten imágenes JPEG o PNG." });

            if (request.DocumentImage.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "La imagen no puede sobrepasar los 5 MB." });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var currentUser = await _userManager.FindByIdAsync(userId);
            if (currentUser == null)
                return NotFound();

            if (currentUser.IdentityValidationStatus == ValidationStatus.Approved)
                return BadRequest(new { message = "El usuario ya se encuentra validado." });

            var validationResponse = await _n8nValidationService.ValidateDocumentAsync(
                "", // En este proyecto no vemos Cédula a nivel UserManager (puedes inyectar PersonaRepository para sacarla luego si es requerida).
                $"{currentUser.Nombre} {currentUser.Apellido}",
                request.DocumentImage
            );

            if (validationResponse.Success)
            {
                currentUser.IdentityValidationStatus = ValidationStatus.Approved;
                currentUser.IdentityValidationMessage = "Identidad verificada exitosamente.";
                currentUser.IdentityValidatedAt = System.DateTime.UtcNow;
                
                await _userManager.UpdateAsync(currentUser);
                
                return Ok(new { success = true, status = "Approved" });
            }
            else
            {
                currentUser.IdentityValidationStatus = ValidationStatus.Rejected;
                currentUser.IdentityValidationMessage = validationResponse.Message ?? "La imagen no superó la verificación.";
                
                await _userManager.UpdateAsync(currentUser);

                return BadRequest(new { 
                    success = false, 
                    status = "Rejected", 
                    message = currentUser.IdentityValidationMessage 
                });
            }
        }
    }

    public class IdentityValidationRequestDto
    {
        public IFormFile DocumentImage { get; set; } = default!;
    }
}
