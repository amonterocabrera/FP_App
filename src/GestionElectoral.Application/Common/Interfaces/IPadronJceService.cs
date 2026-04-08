using GestionElectoral.Application.Features.Personas.Queries.BuscarEnPadron;

namespace GestionElectoral.Application.Common.Interfaces
{
    /// <summary>
    /// Acceso de solo lectura a la base de datos externa PadronJCE.
    /// Nunca escribe en esa base de datos.
    /// </summary>
    public interface IPadronJceService
    {
        Task<PadronCiudadanoDto?> BuscarPorCedulaAsync(string cedula, CancellationToken ct = default);

        Task<byte[]?> ObtenerFotoAsync(string cedula, CancellationToken ct = default);

        /// <summary>Solo para diagnóstico en desarrollo — ver formato real de cédulas en PadronJCE.</summary>
        Task<object> DiagnosticarAsync(string cedula, CancellationToken ct = default);
    }
}
