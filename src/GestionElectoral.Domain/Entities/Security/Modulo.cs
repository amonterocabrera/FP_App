using System;
using System.Collections.Generic;
using GestionElectoral.Domain.Common;

namespace GestionElectoral.Domain.Entities.Security
{
    public class Modulo : BaseEntity
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string Ruta { get; set; } = string.Empty; // e.g. /personas
        public string? Icono { get; set; }
        public int Orden { get; set; } = 0;

        public virtual ICollection<Permiso> Permisos { get; set; } = new List<Permiso>();
    }
}
