using System.Threading;
using System.Threading.Tasks;
using GestionElectoral.Application.Common.Interfaces;
using GestionElectoral.Application.Common.Models;
using MediatR;

namespace GestionElectoral.Application.Features.Auth.Commands.Login
{
    public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResult>
    {
        private readonly IIdentityService _identityService;

        public LoginCommandHandler(IIdentityService identityService)
        {
            _identityService = identityService;
        }

        public async Task<AuthResult> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            return await _identityService.LoginAsync(request.Email, request.Password, request.RememberMe);
        }
    }
}
