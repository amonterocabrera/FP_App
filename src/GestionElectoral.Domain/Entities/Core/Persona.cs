using System;
using System.Collections.Generic;
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

        /// <summary>
        /// Correo electrónico principal. Los teléfonos/contactos ahora
        /// están en la colección Contactos (PersonaContacto).
        /// </summary>
        public string? Email { get; set; }
        public string? Direccion { get; set; }

        // Navegación — contactos (teléfonos, WhatsApp, etc.)
        public virtual ICollection<PersonaContacto> Contactos { get; set; } 
            = new List<PersonaContacto>();
    }
}
