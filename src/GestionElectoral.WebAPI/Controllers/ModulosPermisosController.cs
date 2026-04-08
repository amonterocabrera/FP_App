using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using GestionElectoral.Domain.Entities.Security;
using GestionElectoral.Domain.Enums;
using GestionElectoral.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GestionElectoral.WebAPI.Controllers
{
    [ApiController]
    [Route("api/modulos")]
    [Authorize]
    public class ModulosController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

        public ModulosController(ApplicationDbContext db) => _db = db;

        // GET /api/modulos
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool? isActive)
        {
            var query = _db.Modulos.AsQueryable();
            if (isActive.HasValue) query = query.Where(m => m.IsActive == isActive.Value);
            var result = await query.OrderBy(m => m.Orden).ThenBy(m => m.Nombre).ToListAsync();
            return Ok(result);
        }

        // GET /api/modulos/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var m = await _db.Modulos.Include(x => x.Permisos).FirstOrDefaultAsync(x => x.Id == id);
            return m is null ? NotFound() : Ok(m);
        }

        // POST /api/modulos
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ModuloRequest req)
        {
            if (await _db.Modulos.AnyAsync(m => m.Nombre == req.Nombre))
                return Conflict(new { error = "Ya existe un módulo con ese nombre." });

            var modulo = new Modulo
            {
                Nombre      = req.Nombre,
                Descripcion = req.Descripcion,
                Ruta        = req.Ruta,
                Icono       = req.Icono,
                Orden       = req.Orden,
                IsActive    = true,
                CreatedBy   = UserId,
                CreatedAt   = DateTimeOffset.UtcNow
            };
            _db.Modulos.Add(modulo);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = modulo.Id }, new { modulo.Id });
        }

        // PUT /api/modulos/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] ModuloRequest req)
        {
            var m = await _db.Modulos.FindAsync(id);
            if (m is null) return NotFound();
            m.Nombre = req.Nombre; m.Descripcion = req.Descripcion; m.Ruta = req.Ruta;
            m.Icono = req.Icono; m.Orden = req.Orden; m.IsActive = req.IsActive;
            m.UpdatedBy = UserId; m.UpdatedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/modulos/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var m = await _db.Modulos.FindAsync(id);
            if (m is null) return NotFound();
            m.IsDeleted = true; m.IsActive = false;
            m.UpdatedBy = UserId; m.UpdatedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // PATCH /api/modulos/{id}/toggle
        [HttpPatch("{id:int}/toggle")]
        public async Task<IActionResult> Toggle(int id)
        {
            var m = await _db.Modulos.FindAsync(id);
            if (m is null) return NotFound();
            m.IsActive = !m.IsActive; m.UpdatedBy = UserId; m.UpdatedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { m.IsActive });
        }
    }

    [ApiController]
    [Route("api/permisos")]
    [Authorize]
    public class PermisosController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

        public PermisosController(ApplicationDbContext db) => _db = db;

        // GET /api/permisos?moduloId=
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? moduloId)
        {
            var query = _db.Permisos.Include(p => p.Modulo).AsQueryable();
            if (moduloId.HasValue) query = query.Where(p => p.ModuloId == moduloId.Value);
            var result = await query.OrderBy(p => p.ModuloId).ThenBy(p => p.Nombre).Select(p => new
            {
                p.Id, p.ModuloId, Modulo = p.Modulo.Nombre,
                p.Nombre, p.Clave, p.Accion, p.IsActive
            }).ToListAsync();
            return Ok(result);
        }

        // GET /api/permisos/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var p = await _db.Permisos.Include(x => x.Modulo).FirstOrDefaultAsync(x => x.Id == id);
            return p is null ? NotFound() : Ok(new { p.Id, p.ModuloId, Modulo = p.Modulo.Nombre, p.Nombre, p.Clave, p.Accion, p.IsActive });
        }

        // POST /api/permisos
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PermisoRequest req)
        {
            if (await _db.Permisos.AnyAsync(p => p.Clave == req.Clave))
                return Conflict(new { error = $"Ya existe un permiso con la clave '{req.Clave}'." });

            var permiso = new Permiso
            {
                ModuloId  = req.ModuloId,
                Nombre    = req.Nombre,
                Clave     = req.Clave,
                Accion    = req.Accion,
                IsActive  = true,
                CreatedBy = UserId,
                CreatedAt = DateTimeOffset.UtcNow
            };
            _db.Permisos.Add(permiso);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = permiso.Id }, new { permiso.Id });
        }

        // PUT /api/permisos/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] PermisoRequest req)
        {
            var p = await _db.Permisos.FindAsync(id);
            if (p is null) return NotFound();
            p.ModuloId = req.ModuloId; p.Nombre = req.Nombre;
            p.Clave = req.Clave; p.Accion = req.Accion; p.IsActive = req.IsActive;
            p.UpdatedBy = UserId; p.UpdatedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/permisos/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var p = await _db.Permisos.FindAsync(id);
            if (p is null) return NotFound();
            p.IsDeleted = true; p.IsActive = false;
            p.UpdatedBy = UserId; p.UpdatedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }

    // ─── Request records ───
    public record ModuloRequest(string Nombre, string? Descripcion, string Ruta, string? Icono, int Orden = 0, bool IsActive = true);
    public record PermisoRequest(int ModuloId, string Nombre, string Clave, AccionPermiso Accion, bool IsActive = true);
}
