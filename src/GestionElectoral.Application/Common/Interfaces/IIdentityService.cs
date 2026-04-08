using System.Threading.Tasks;
using GestionElectoral.Application.Common.Models;

namespace GestionElectoral.Application.Common.Interfaces
{
    public interface IIdentityService
    {
        Task<AuthResult> LoginAsync(string email, string password, bool rememberMe);
        Task<AuthResult> RefreshTokenAsync(string token, string refreshToken);
        Task<AuthResult> LogoutAsync(string userId);
        Task<AuthResult> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
        Task<AuthResult> AdminResetPasswordAsync(string userId, string newPassword, bool mustChange, string requestedBy);
        Task<UserSessionDto?> GetMeAsync(string userId);
    }
}
