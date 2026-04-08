using GestionElectoral.Application.Common.Interfaces;
using GestionElectoral.Application.Features.Personas.Queries.GetPersonas;
using MediatR;

namespace GestionElectoral.Application.Features.Personas.Queries.GetPersonaById
{
    public record GetPersonaByIdQuery(Guid Id) : IRequest<PersonaDto?>;

    public class GetPersonaByIdQueryHandler : IRequestHandler<GetPersonaByIdQuery, PersonaDto?>
    {
        private readonly IPersonaRepository _repo;

        public GetPersonaByIdQueryHandler(IPersonaRepository repo) => _repo = repo;

        public Task<PersonaDto?> Handle(
            GetPersonaByIdQuery request,
            CancellationToken cancellationToken)
            => _repo.ObtenerPorIdAsync(request.Id, cancellationToken);
    }
}
