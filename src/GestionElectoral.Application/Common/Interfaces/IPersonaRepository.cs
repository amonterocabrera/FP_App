using GestionElectoral.Application.Features.Personas.Queries.GetPersonas;
using GestionElectoral.Domain.Entities.Core;

namespace GestionElectoral.Application.Common.Interfaces
{
    public interface IPersonaRepository
    {
        Task<bool> ExistePorCedulaAsync(string cedula, CancellationToken ct = default);

        Task<(List<PersonaDto> Items, int Total)> ListarAsync(
            string? busqueda, int pagina, int tamPagina, string? currentUsuarioId = null, CancellationToken ct = default);

        Task<PersonaDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default);

        /// <summary>Persiste una nueva Persona y sus contactos en GestionElectoral.</summary>
        Task GuardarAsync(Persona persona, CancellationToken ct = default);
    }
}
