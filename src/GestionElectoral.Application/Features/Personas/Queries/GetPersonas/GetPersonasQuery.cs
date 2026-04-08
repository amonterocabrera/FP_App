using GestionElectoral.Application.Common.Interfaces;
using GestionElectoral.Application.Features.Personas.Queries.GetPersonas;
using MediatR;

namespace GestionElectoral.Application.Features.Personas.Queries.GetPersonas
{
    // ── Query ────────────────────────────────────────────────────────────────────

    public record GetPersonasQuery(
        string? Busqueda = null,
        int Pagina = 1,
        int TamPagina = 20,
        string? CurrentUsuarioId = null)
        : IRequest<GetPersonasResult>;

    public record GetPersonasResult(List<PersonaDto> Items, int Total, int Pagina, int TamPagina);

    // ── Handler ──────────────────────────────────────────────────────────────────

    public class GetPersonasQueryHandler : IRequestHandler<GetPersonasQuery, GetPersonasResult>
    {
        private readonly IPersonaRepository _repo;

        public GetPersonasQueryHandler(IPersonaRepository repo) => _repo = repo;

        public async Task<GetPersonasResult> Handle(
            GetPersonasQuery request,
            CancellationToken cancellationToken)
        {
            var (items, total) = await _repo.ListarAsync(
                request.Busqueda, request.Pagina, request.TamPagina, request.CurrentUsuarioId, cancellationToken);

            return new GetPersonasResult(items, total, request.Pagina, request.TamPagina);
        }
    }
}
