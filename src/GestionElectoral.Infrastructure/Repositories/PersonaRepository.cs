using AutoMapper;
using GestionElectoral.Application.Common.Interfaces;
using GestionElectoral.Application.Features.Personas.Queries.GetPersonas;
using GestionElectoral.Domain.Entities.Core;
using GestionElectoral.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GestionElectoral.Infrastructure.Repositories
{
    public class PersonaRepository : IPersonaRepository
    {
        private readonly ApplicationDbContext _db;
        private readonly IMapper _mapper;

        public PersonaRepository(ApplicationDbContext db, IMapper mapper)
        {
            _db     = db;
            _mapper = mapper;
        }

        public Task<bool> ExistePorCedulaAsync(string cedula, CancellationToken ct = default)
            => _db.Personas.AnyAsync(p => p.Cedula == cedula && !p.IsDeleted, ct);

        public async Task<(List<PersonaDto> Items, int Total)> ListarAsync(
            string? busqueda, int pagina, int tamPagina, CancellationToken ct = default)
        {
            var query = _db.Personas
                .Include(p => p.Contactos.Where(c => !c.IsDeleted))
                .Where(p => !p.IsDeleted)
                .AsNoTracking();

            if (!string.IsNullOrWhiteSpace(busqueda))
            {
                var term = busqueda.Trim().ToLower();
                query = query.Where(p =>
                    p.Cedula.Contains(term) ||
                    p.Nombre.ToLower().Contains(term) ||
                    p.Apellido.ToLower().Contains(term));
            }

            var total = await query.CountAsync(ct);
            var personas = await query
                .OrderBy(p => p.Apellido).ThenBy(p => p.Nombre)
                .Skip((pagina - 1) * tamPagina)
                .Take(tamPagina)
                .ToListAsync(ct);

            return (_mapper.Map<List<PersonaDto>>(personas), total);
        }

        public async Task<PersonaDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default)
        {
            var persona = await _db.Personas
                .Include(p => p.Contactos.Where(c => !c.IsDeleted))
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, ct);

            return persona is null ? null : _mapper.Map<PersonaDto>(persona);
        }

        public async Task GuardarAsync(Persona persona, CancellationToken ct = default)
        {
            _db.Personas.Add(persona);
            await _db.SaveChangesAsync(ct);
        }
    }
}
