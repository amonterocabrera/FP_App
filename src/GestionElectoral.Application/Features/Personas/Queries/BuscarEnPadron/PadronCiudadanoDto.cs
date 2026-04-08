namespace GestionElectoral.Application.Features.Personas.Queries.BuscarEnPadron
{
    /// <summary>
    /// DTO con los datos del ciudadano leídos desde PadronJCE.
    /// Solo para consulta — nunca se persiste directamente.
    /// </summary>
    public class PadronCiudadanoDto
    {
        public string Cedula { get; set; } = string.Empty;

        /// <summary>Nombre(s) completo(s) del ciudadano.</summary>
        public string Nombres { get; set; } = string.Empty;

        public string Apellido1 { get; set; } = string.Empty;
        public string Apellido2 { get; set; } = string.Empty;

        /// <summary>1 = Masculino, 2 = Femenino (según codificación JCE).</summary>
        public int IdSexo { get; set; }

        public DateTime? FechaNacimiento { get; set; }

        // ── Campos calculados/convenientes ──────────────────────────────────

        /// <summary>Nombre completo para mostrar en UI.</summary>
        public string NombreCompleto =>
            $"{Nombres} {Apellido1} {Apellido2}".Trim();

        /// <summary>Genero mapeado al enum del dominio.</summary>
        public string Genero => IdSexo == 2 ? "F" : "M";
    }
}
