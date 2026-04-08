using GestionElectoral.Application.Common.Models;
using MediatR;

namespace GestionElectoral.Application.Features.Auth.Commands.Login
{
    public class LoginCommand : IRequest<AuthResult>
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool RememberMe { get; set; } = false;
    }
}
