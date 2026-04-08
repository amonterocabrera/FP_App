using System.Security.Claims;
using GestionElectoral.Application.Common.Interfaces;
using GestionElectoral.Application.Common.Models;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GestionElectoral.Application.Features.Auth.Commands.Login;

namespace GestionElectoral.WebAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly ISender _mediator;
        private readonly IIdentityService _identityService;

        public AuthController(ISender mediator, IIdentityService identityService)
        {
            _mediator = mediator;
            _identityService = identityService;
        }

        /// <summary>Login — devuelve JWT + RefreshToken + perfil completo.</summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginCommand command)
        {
            var result = await _mediator.Send(command);
            return result.Succeeded ? Ok(result) : Unauthorized(new { errors = result.Errors });
        }

        /// <summary>Renovar JWT usando el Refresh Token.</summary>
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
        {
            var result = await _identityService.RefreshTokenAsync(request.Token, request.RefreshToken);
            return result.Succeeded ? Ok(result) : Unauthorized(new { errors = result.Errors });
        }

        /// <summary>Logout — revoca el Refresh Token del usuario.</summary>
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
            await _identityService.LogoutAsync(userId);
            return NoContent();
        }

        /// <summary>Perfil del usuario autenticado + módulos y permisos activos.</summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
            var session = await _identityService.GetMeAsync(userId);
            return session is null ? NotFound() : Ok(session);
        }

        /// <summary>Cambiar contraseña (el propio usuario).</summary>
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
            var result = await _identityService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);
            return result.Succeeded ? Ok(new { message = "Contraseña actualizada." }) : BadRequest(new { errors = result.Errors });
        }
    }

    // ─── Request DTOs exclusivos del controller ───
    public record RefreshRequest(string Token, string RefreshToken);
    public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
}
