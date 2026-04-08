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
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace GestionElectoral.Infrastructure.Services
{
    public class IdentityService : IIdentityService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;

        public IdentityService(UserManager<ApplicationUser> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        public async Task<AuthResult> LoginAsync(string email, string password, bool rememberMe)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null || !user.IsActive || user.IsDeleted)
            {
                return new AuthResult { Succeeded = false, Errors = ["Credenciales inválidas o cuenta desactivada."] };
            }

            var result = await _userManager.CheckPasswordAsync(user, password);
            if (!result)
            {
                return new AuthResult { Succeeded = false, Errors = ["Credenciales inválidas."] };
            }

            // Expiración si remember me (30 días), de lo contrario 1 hora
            var tokenString = await GenerateJwtTokenAsync(user, rememberMe ? TimeSpan.FromDays(30) : TimeSpan.FromHours(1));
            var refreshToken = GenerateRefreshToken();
            
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTimeOffset.UtcNow.Add(rememberMe ? TimeSpan.FromDays(60) : TimeSpan.FromDays(1)); // Refresh Token lifespan
            
            await _userManager.UpdateAsync(user);

            return new AuthResult { Succeeded = true, Token = tokenString, RefreshToken = refreshToken };
        }

        public async Task<AuthResult> RegisterAsync(string email, string password, string nombre, string apellido)
        {
            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                Nombre = nombre,
                Apellido = apellido,
                IsActive = true
            };

            var result = await _userManager.CreateAsync(user, password);

            if (result.Succeeded)
            {
                return new AuthResult { Succeeded = true };
            }

            return new AuthResult
            {
                Succeeded = false,
                Errors = result.Errors.Select(e => e.Description).ToArray()
            };
        }

        public async Task<AuthResult> RefreshTokenAsync(string token, string refreshToken)
        {
            // First we decode token to get the user ID without validating the expiration
            var principal = GetPrincipalFromExpiredToken(token);
            if (principal == null)
            {
                 return new AuthResult { Succeeded = false, Errors = ["Token inválido."] };
            }

            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) 
                 return new AuthResult { Succeeded = false, Errors = ["Token inválido."] };

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null || user.RefreshToken != refreshToken || user.RefreshTokenExpiry <= DateTimeOffset.UtcNow)
            {
                return new AuthResult { Succeeded = false, Errors = ["Token de refresco inválido o expirado."] };
            }

            var newJwtToken = await GenerateJwtTokenAsync(user, TimeSpan.FromHours(1));
            var newRefreshToken = GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            await _userManager.UpdateAsync(user);

            return new AuthResult { Succeeded = true, Token = newJwtToken, RefreshToken = newRefreshToken };
        }

        private async Task<string> GenerateJwtTokenAsync(ApplicationUser user, TimeSpan expires)
        {
            var userRoles = await _userManager.GetRolesAsync(user);
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName!),
                new Claim(ClaimTypes.Email, user.Email!)
            };

            foreach (var role in userRoles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Secret"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.Add(expires),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = false,
                ValidateIssuer = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Secret"]!)),
                ValidateLifetime = false // Que permita validar un token vencido
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
            
            var jwtSecurityToken = securityToken as JwtSecurityToken;
            if (jwtSecurityToken == null || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                throw new SecurityTokenException("Invalid token");

            return principal;
        }
    }
}
