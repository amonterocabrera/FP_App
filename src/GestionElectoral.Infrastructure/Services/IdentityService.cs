using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using GestionElectoral.Application.Common.Interfaces;
using GestionElectoral.Application.Common.Models;
using GestionElectoral.Domain.Entities.Identity;
using GestionElectoral.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace GestionElectoral.Infrastructure.Services
{
    public class IdentityService : IIdentityService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _db;

        public IdentityService(
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration,
            ApplicationDbContext db)
        {
            _userManager = userManager;
            _configuration = configuration;
            _db = db;
        }

        // ─────────────────────────────────────────────
        // LOGIN con Lockout real
        // ─────────────────────────────────────────────
        public async Task<AuthResult> LoginAsync(string email, string password, bool rememberMe)
        {
            var user = await _userManager.FindByEmailAsync(email);

            if (user == null || user.IsDeleted)
                return AuthResult.Fail("Credenciales inválidas.");

            if (!user.IsActive)
                return AuthResult.Fail("La cuenta está desactivada. Contacte al administrador.");

            // Verificar si está bloqueado actualmente
            if (await _userManager.IsLockedOutAsync(user))
            {
                var until = user.LockoutEnd?.ToLocalTime().ToString("HH:mm") ?? "unos minutos";
                return AuthResult.Fail($"Cuenta bloqueada. Intente nuevamente a las {until}.");
            }

            // Verificar contraseña — Identity NO incrementa AccessFailedCount automáticamente con CheckPasswordAsync
            var passwordOk = await _userManager.CheckPasswordAsync(user, password);
            if (!passwordOk)
            {
                // Incrementar contador (al llegar a 5 Identity bloquea automáticamente)
                await _userManager.AccessFailedAsync(user);

                // Leer estado fresco para saber si ya se bloqueó
                var refreshed = await _userManager.FindByIdAsync(user.Id);
                if (refreshed != null && await _userManager.IsLockedOutAsync(refreshed))
                    return AuthResult.Fail("Cuenta bloqueada por 15 minutos por exceso de intentos.");

                var remaining = _userManager.Options.Lockout.MaxFailedAccessAttempts - (user.AccessFailedCount + 1);
                return AuthResult.Fail($"Contraseña incorrecta. {Math.Max(0, remaining)} intento(s) restante(s).");
            }

            // Login correcto → resetear contador
            await _userManager.ResetAccessFailedCountAsync(user);

            var tokenExpiry = rememberMe ? TimeSpan.FromDays(30) : TimeSpan.FromHours(8);
            var token = await GenerateJwtTokenAsync(user, tokenExpiry);
            var refresh = GenerateRefreshToken();

            user.RefreshToken = refresh;
            user.RefreshTokenExpiry = DateTimeOffset.UtcNow.Add(
                rememberMe ? TimeSpan.FromDays(60) : TimeSpan.FromDays(1));
            await _userManager.UpdateAsync(user);

            var session = await BuildSessionAsync(user);

            return AuthResult.Ok(token, refresh, user.MustChangePassword, session);
        }

        // ─────────────────────────────────────────────
        // REFRESH TOKEN
        // ─────────────────────────────────────────────
        public async Task<AuthResult> RefreshTokenAsync(string token, string refreshToken)
        {
            var principal = GetPrincipalFromExpiredToken(token);
            if (principal == null)
                return AuthResult.Fail("Token inválido.");

            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return AuthResult.Fail("Token inválido.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || user.RefreshToken != refreshToken || user.RefreshTokenExpiry <= DateTimeOffset.UtcNow)
                return AuthResult.Fail("Refresh token inválido o expirado.");

            var newToken = await GenerateJwtTokenAsync(user, TimeSpan.FromHours(8));
            var newRefresh = GenerateRefreshToken();

            user.RefreshToken = newRefresh;
            user.RefreshTokenExpiry = DateTimeOffset.UtcNow.AddDays(1);
            await _userManager.UpdateAsync(user);

            var session = await BuildSessionAsync(user);
            return AuthResult.Ok(newToken, newRefresh, user.MustChangePassword, session);
        }

        // ─────────────────────────────────────────────
        // LOGOUT: revocar refresh token
        // ─────────────────────────────────────────────
        public async Task<AuthResult> LogoutAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return AuthResult.Fail("Usuario no encontrado.");

            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            await _userManager.UpdateAsync(user);

            return new AuthResult { Succeeded = true };
        }

        // ─────────────────────────────────────────────
        // CAMBIAR CONTRASEÑA (usuario mismo)
        // ─────────────────────────────────────────────
        public async Task<AuthResult> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return AuthResult.Fail("Usuario no encontrado.");

            var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
            if (!result.Succeeded)
                return AuthResult.Fail(result.Errors.Select(e => e.Description).ToArray());

            user.MustChangePassword = false;
            await _userManager.UpdateAsync(user);
            return new AuthResult { Succeeded = true };
        }

        // ─────────────────────────────────────────────
        // RESET DE CONTRASEÑA (admin)
        // ─────────────────────────────────────────────
        public async Task<AuthResult> AdminResetPasswordAsync(
            string userId, string newPassword, bool mustChange, string requestedBy)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return AuthResult.Fail("Usuario no encontrado.");

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
            if (!result.Succeeded)
                return AuthResult.Fail(result.Errors.Select(e => e.Description).ToArray());

            user.MustChangePassword = mustChange;
            user.UpdatedBy = requestedBy;
            user.UpdatedAt = DateTimeOffset.UtcNow;
            await _userManager.UpdateAsync(user);
            return new AuthResult { Succeeded = true };
        }

        // ─────────────────────────────────────────────
        // PERFIL AUTENTICADO (/me)
        // ─────────────────────────────────────────────
        public async Task<UserSessionDto?> GetMeAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || user.IsDeleted) return null;
            return await BuildSessionAsync(user);
        }

        // ─────────────────────────────────────────────
        // HELPERS PRIVADOS
        // ─────────────────────────────────────────────
        private async Task<UserSessionDto> BuildSessionAsync(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var permisos = await GetPermisosAsync(roles);
            var modulos = await GetModulosAsync(roles);

            return new UserSessionDto
            {
                Id = user.Id,
                Nombre = user.Nombre,
                Apellido = user.Apellido,
                Email = user.Email!,
                Roles = roles.ToList(),
                Permisos = permisos,
                Modulos = modulos,
                IdentityValidationStatus = user.IdentityValidationStatus
            };
        }

        private async Task<List<string>> GetPermisosAsync(IList<string> roles)
        {
            if (!roles.Any()) return new List<string>();

            return await _db.RolPermisos
                .AsNoTracking()
                .Include(rp => rp.Rol)
                .Include(rp => rp.Permiso)
                .Where(rp => roles.Contains(rp.Rol.Name!) && rp.IsActive)
                .Select(rp => rp.Permiso.Clave)
                .Distinct()
                .ToListAsync();
        }

        private async Task<List<ModuloSessionDto>> GetModulosAsync(IList<string> roles)
        {
            if (!roles.Any()) return new List<ModuloSessionDto>();

            return await _db.RolPermisos
                .AsNoTracking()
                .Include(rp => rp.Rol)
                .Include(rp => rp.Permiso)
                    .ThenInclude(p => p.Modulo)
                .Where(rp => roles.Contains(rp.Rol.Name!) && rp.IsActive)
                .Select(rp => rp.Permiso.Modulo)
                .Distinct()
                .OrderBy(m => m.Orden)
                .Select(m => new ModuloSessionDto
                {
                    Id = m.Id,
                    Nombre = m.Nombre,
                    Ruta = m.Ruta,
                    Icono = m.Icono,
                    Orden = m.Orden
                })
                .ToListAsync();
        }

        private async Task<string> GenerateJwtTokenAsync(ApplicationUser user, TimeSpan expires)
        {
            var roles = await _userManager.GetRolesAsync(user);

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub,   user.Id),
                new(JwtRegisteredClaimNames.Email, user.Email!),
                new(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
                new("nombre",               user.Nombre),
                new("apellido",             user.Apellido),
                new("must_change_password", user.MustChangePassword.ToString().ToLower()),
            };

            foreach (var role in roles)
                claims.Add(new Claim(ClaimTypes.Role, role));

            var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Secret"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var jwtToken = new JwtSecurityToken(
                issuer:             _configuration["JwtSettings:Issuer"],
                audience:           _configuration["JwtSettings:Audience"],
                claims:             claims,
                expires:            DateTime.UtcNow.Add(expires),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(jwtToken);
        }

        private static string GenerateRefreshToken()
        {
            var bytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes);
        }

        private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
        {
            var parameters = new TokenValidationParameters
            {
                ValidateAudience         = false,
                ValidateIssuer           = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(_configuration["JwtSettings:Secret"]!)),
                ValidateLifetime = false // permite tokens vencidos
            };

            var handler   = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(token, parameters, out var securityToken);

            if (securityToken is not JwtSecurityToken jwt ||
                !jwt.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.OrdinalIgnoreCase))
                return null;

            return principal;
        }
    }
}
