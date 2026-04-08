using GestionElectoral.Application.Common.Interfaces;
using MediatR;

namespace GestionElectoral.Application.Features.Personas.Queries.BuscarEnPadron
{
    // ── Query ────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Busca un ciudadano en el PadronJCE por cédula.
    /// No persiste nada — solo consulta.
    /// </summary>
    public record BuscarEnPadronQuery(string Cedula)
        : IRequest<PadronCiudadanoDto?>;

    // ── Handler ──────────────────────────────────────────────────────────────────

    public class BuscarEnPadronQueryHandler : IRequestHandler<BuscarEnPadronQuery, PadronCiudadanoDto?>
    {
        private readonly IPadronJceService _padron;

        public BuscarEnPadronQueryHandler(IPadronJceService padron)
            => _padron = padron;

        public Task<PadronCiudadanoDto?> Handle(
            BuscarEnPadronQuery request,
            CancellationToken cancellationToken)
            => _padron.BuscarPorCedulaAsync(request.Cedula, cancellationToken);
    }
}
