using GestionElectoral.Domain.Enums;

namespace GestionElectoral.Application.Features.Personas.Queries.GetPersonas
{
    public class PersonaDto
    {
        public Guid Id { get; set; }
        public string Cedula { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string NombreCompleto => $"{Nombre} {Apellido}".Trim();
        public DateTime? FechaNacimiento { get; set; }
        public Genero Genero { get; set; }
        public string? Email { get; set; }
        public string? Direccion { get; set; }
        public bool IsActive { get; set; }

        /// <summary>
        /// URL relativa para obtener la foto desde el padrón.
        /// El endpoint de foto llama dinámicamente a PadronJCE.
        /// </summary>
        public string FotoUrl => $"/api/personas/{Cedula}/foto";

        public List<ContactoDto> Contactos { get; set; } = new();
    }

    public class ContactoDto
    {
        public int Id { get; set; }
        public TipoContacto Tipo { get; set; }
        public string TipoNombre => Tipo.ToString();
        public string Valor { get; set; } = string.Empty;
        public bool EsPrincipal { get; set; }
        public string? Nota { get; set; }
    }
}
