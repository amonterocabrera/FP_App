namespace GestionElectoral.Domain.Enums
{
    /// <summary>
    /// Define el tipo de número o medio de contacto de una Persona.
    /// </summary>
    public enum TipoContacto
    {
        Movil = 1,       // Teléfono celular/móvil personal
        Fijo = 2,        // Teléfono fijo/residencial
        Trabajo = 3,     // Teléfono de oficina o trabajo
        Casa = 4,        // Teléfono de casa (distinto al fijo si aplica)
        WhatsApp = 5,    // Número habilitado para WhatsApp
        Otro = 99
    }
}
