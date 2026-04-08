using System.Threading.Tasks;
using GestionElectoral.Application.Common.Models;

namespace GestionElectoral.Application.Common.Interfaces
{
    public interface IIdentityService
    {
        Task<AuthResult> LoginAsync(string email, string password, bool rememberMe);
        Task<AuthResult> RegisterAsync(string email, string password, string nombre, string apellido);
        Task<AuthResult> RefreshTokenAsync(string token, string refreshToken);
    }
}
