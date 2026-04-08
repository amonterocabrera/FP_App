using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using GestionElectoral.Domain.Entities.Core;
using GestionElectoral.Domain.Enums;
using GestionElectoral.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GestionElectoral.WebAPI.Controllers
{
    [ApiController]
    [Route("api/personas")]
    [Authorize]
    public class PersonasController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

        public PersonasController(ApplicationDbContext db) => _db = db;

        // GET /api/personas
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var query = _db.Personas.AsNoTracking().Where(p => !p.IsDeleted).AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(p => p.Cedula.Contains(search) || 
                                         p.Nombre.Contains(search) || 
                                         p.Apellido.Contains(search));
            }

            var totalCount = await query.CountAsync();
            var items = await query.OrderBy(p => p.Apellido).ThenBy(p => p.Nombre)
                                   .Skip((page - 1) * pageSize).Take(pageSize)
                                   .ToListAsync();

            return Ok(new { items, totalCount, page, pageSize });
        }

        // GET /api/personas/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var p = await _db.Personas.Include(x => x.Contactos).FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
            return p is null ? NotFound() : Ok(p);
        }

        // POST /api/personas
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PersonaRequest req)
        {
            if (await _db.Personas.AnyAsync(p => p.Cedula == req.Cedula && !p.IsDeleted))
                return Conflict(new { error = "Ya existe una persona activa con esta cédula." });

            var persona = new Persona
            {
                Id = Guid.NewGuid(),
                Cedula = req.Cedula,
                Nombre = req.Nombre,
                Apellido = req.Apellido,
                FechaNacimiento = req.FechaNacimiento,
                Genero = req.Genero,
                Email = req.Email,
                Direccion = req.Direccion,
                CreatedBy = UserId,
                CreatedAt = DateTimeOffset.UtcNow
            };

            if (req.Contactos != null && req.Contactos.Any())
            {
                foreach(var c in req.Contactos)
                {
                    persona.Contactos.Add(new PersonaContacto 
                    {
                        Valor = c.Valor, 
                        Tipo = c.Tipo,
                        EsPrincipal = c.EsPrincipal,
                        Nota = c.Nota,
                        CreatedBy = UserId,
                        CreatedAt = DateTimeOffset.UtcNow
                    });
                }
            }

            _db.Personas.Add(persona);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = persona.Id }, new { persona.Id });
        }

        // PUT /api/personas/{id}
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] PersonaRequest req)
        {
            var p = await _db.Personas.Include(x => x.Contactos).FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
            if (p is null) return NotFound();

            p.Cedula = req.Cedula; p.Nombre = req.Nombre; p.Apellido = req.Apellido;
            p.FechaNacimiento = req.FechaNacimiento; p.Genero = req.Genero; 
            p.Email = req.Email; p.Direccion = req.Direccion;
            p.UpdatedBy = UserId; p.UpdatedAt = DateTimeOffset.UtcNow;

            _db.PersonaContactos.RemoveRange(p.Contactos);
            
            if (req.Contactos != null && req.Contactos.Any())
            {
                foreach(var c in req.Contactos)
                {
                    p.Contactos.Add(new PersonaContacto 
                    {
                        Valor = c.Valor, 
                        Tipo = c.Tipo,
                        EsPrincipal = c.EsPrincipal,
                        Nota = c.Nota,
                        CreatedBy = UserId,
                        CreatedAt = DateTimeOffset.UtcNow
                    });
                }
            }

            await _db.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/personas/{id}
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var p = await _db.Personas.FindAsync(id);
            if (p is null) return NotFound();
            p.IsDeleted = true;
            p.UpdatedBy = UserId; p.UpdatedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }

    public record PersonaContactoRequest(string Valor, TipoContacto Tipo, bool EsPrincipal, string? Nota);
    public record PersonaRequest(string Cedula, string Nombre, string Apellido, DateTime? FechaNacimiento, Genero Genero, string? Email, string? Direccion, PersonaContactoRequest[]? Contactos);
}
