using System;
using Microsoft.AspNetCore.Identity;

namespace GestionElectoral.Domain.Entities.Identity
{
    public class ApplicationRole : IdentityRole
    {
        public string Descripcion { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;
        
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public string CreatedBy { get; set; } = string.Empty;
        
        public DateTimeOffset? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
    }
}
