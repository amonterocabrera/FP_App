using System;
using GestionElectoral.Domain.Common;
using GestionElectoral.Domain.Enums;

namespace GestionElectoral.Domain.Entities.Core
{
    public class Persona : BaseEntity
    {
        public Guid Id { get; set; }
        public string Cedula { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public DateTime? FechaNacimiento { get; set; }
        public Genero Genero { get; set; }
        public string? Telefono { get; set; }
        public string? Email { get; set; }
        public string? Direccion { get; set; }
    }
}
