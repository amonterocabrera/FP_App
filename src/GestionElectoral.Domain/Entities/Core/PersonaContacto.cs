using GestionElectoral.Domain.Common;
using GestionElectoral.Domain.Enums;

namespace GestionElectoral.Domain.Entities.Core
{
    /// <summary>
    /// Representa un medio de contacto de una Persona.
    /// Una persona puede tener múltiples contactos de distintos tipos.
    /// </summary>
    public class PersonaContacto : BaseEntity
    {
        public int Id { get; set; }

        /// <summary>FK a la persona propietaria de este contacto.</summary>
        public Guid PersonaId { get; set; }

        /// <summary>Tipo de contacto: Móvil, Fijo, Trabajo, Casa, WhatsApp, Otro.</summary>
        public TipoContacto Tipo { get; set; }

        /// <summary>Número de teléfono o identificador de contacto (ej: +1 809 555 1234).</summary>
        public string Valor { get; set; } = string.Empty;

        /// <summary>Indica si este es el contacto principal de su tipo para esta persona.</summary>
        public bool EsPrincipal { get; set; } = false;

        /// <summary>Nota libre del operador (ej: "Solo disponible mañanas").</summary>
        public string? Nota { get; set; }

        // Navegación
        public virtual Persona Persona { get; set; } = null!;
    }
}
