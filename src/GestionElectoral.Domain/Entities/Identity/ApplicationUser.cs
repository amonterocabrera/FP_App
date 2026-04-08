using System;
using Microsoft.AspNetCore.Identity;

namespace GestionElectoral.Domain.Entities.Identity
{
    public class ApplicationUser : IdentityUser
    {
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;

        /// <summary>FK opcional hacia la tabla Personas.</summary>
        public Guid? PersonaId { get; set; }

        // JWT Refresh Token
        public string? RefreshToken { get; set; }
        public DateTimeOffset? RefreshTokenExpiry { get; set; }

        /// <summary>Si true, el usuario DEBE cambiar su contraseña al próximo login.</summary>
        public bool MustChangePassword { get; set; } = false;

        // Soft delete + estado
        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;

        // Auditoría
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public string CreatedBy { get; set; } = string.Empty;
        public DateTimeOffset? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }

        // Propiedades de Identity que habilitamos:
        // LockoutEnabled  → configurado true por defecto en Identity options
        // LockoutEnd      → cuándo expira el bloqueo
        // AccessFailedCount → contador de intentos fallidos (Identity lo gestiona)
    }
}
