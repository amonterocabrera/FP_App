using System;
using System.Collections.Generic;
using GestionElectoral.Domain.Common;
using GestionElectoral.Domain.Enums;

namespace GestionElectoral.Domain.Entities.Security
{
    public class Permiso : BaseEntity
    {
        public int Id { get; set; }
        public int ModuloId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        
        // E.g., 'personas.create'
        public string Clave { get; set; } = string.Empty;
        
        public AccionPermiso Accion { get; set; } 

        public virtual Modulo Modulo { get; set; } = null!;
        public virtual ICollection<RolPermiso> RolPermisos { get; set; } = new List<RolPermiso>();
    }
}
