using System;
using GestionElectoral.Domain.Common;
using GestionElectoral.Domain.Entities.Identity;

namespace GestionElectoral.Domain.Entities.Security
{
    public class RolPermiso : BaseEntity
    {
        public string RolId { get; set; } = string.Empty;
        public int PermisoId { get; set; }

        public virtual ApplicationRole Rol { get; set; } = null!;
        public virtual Permiso Permiso { get; set; } = null!;
    }
}
