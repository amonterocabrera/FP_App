using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using GestionElectoral.Domain.Entities.Identity;
using GestionElectoral.Domain.Entities.Security;
using GestionElectoral.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GestionElectoral.WebAPI.Controllers
{
    [ApiController]
    [Route("api/roles")]
    [Authorize]
    public class RolesController : ControllerBase
    {
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly ApplicationDbContext _db;
        private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

        public RolesController(RoleManager<ApplicationRole> roleManager, ApplicationDbContext db)
        {
            _roleManager = roleManager;
            _db = db;
        }

        // GET /api/roles
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool? isActive)
        {
            var query = _roleManager.Roles.Where(r => !r.IsDeleted);
            if (isActive.HasValue) query = query.Where(r => r.IsActive == isActive.Value);

            var roles = await query.OrderBy(r => r.Name).ToListAsync();
            var result = roles.Select(r => new
            {
                r.Id, r.Name, r.Descripcion, r.IsActive,
                r.CreatedAt
            });
            return Ok(result);
        }

        // GET /api/roles/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var role = await _roleManager.FindByIdAsync(id);
            if (role == null || role.IsDeleted) return NotFound();

            var permisos = await _db.RolPermisos
                .Include(rp => rp.Permiso).ThenInclude(p => p.Modulo)
                .Where(rp => rp.RolId == id && rp.IsActive)
                .Select(rp => new { rp.Permiso.Id, rp.Permiso.Nombre, rp.Permiso.Clave, rp.Permiso.Accion, Modulo = rp.Permiso.Modulo.Nombre })
                .ToListAsync();

            return Ok(new { role.Id, role.Name, role.Descripcion, role.IsActive, role.CreatedAt, Permisos = permisos });
        }

        // POST /api/roles
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] RoleRequest req)
        {
            if (await _roleManager.RoleExistsAsync(req.Name))
                return Conflict(new { error = "Ya existe un rol con ese nombre." });

            var role = new ApplicationRole
            {
                Name        = req.Name,
                Descripcion = req.Descripcion ?? string.Empty,
                IsActive    = true,
                CreatedBy   = UserId
            };

            var result = await _roleManager.CreateAsync(role);
            return result.Succeeded
                ? CreatedAtAction(nameof(GetById), new { id = role.Id }, new { role.Id })
                : BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        // PUT /api/roles/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] RoleRequest req)
        {
            var role = await _roleManager.FindByIdAsync(id);
            if (role == null || role.IsDeleted) return NotFound();

            role.Name        = req.Name;
            role.Descripcion = req.Descripcion ?? string.Empty;
            role.IsActive    = req.IsActive;
            role.UpdatedBy   = UserId;
            role.UpdatedAt   = DateTimeOffset.UtcNow;

            var result = await _roleManager.UpdateAsync(role);
            return result.Succeeded ? NoContent() : BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        // DELETE /api/roles/{id}  (soft delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var role = await _roleManager.FindByIdAsync(id);
            if (role == null || role.IsDeleted) return NotFound();

            role.IsDeleted = true;
            role.IsActive  = false;
            role.UpdatedBy = UserId;
            role.UpdatedAt = DateTimeOffset.UtcNow;

            await _roleManager.UpdateAsync(role);
            return NoContent();
        }

        // PATCH /api/roles/{id}/toggle
        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> Toggle(string id)
        {
            var role = await _roleManager.FindByIdAsync(id);
            if (role == null || role.IsDeleted) return NotFound();
            role.IsActive  = !role.IsActive;
            role.UpdatedBy = UserId;
            role.UpdatedAt = DateTimeOffset.UtcNow;
            await _roleManager.UpdateAsync(role);
            return Ok(new { role.IsActive });
        }

        // POST /api/roles/{id}/permisos  (reemplaza todos los permisos del rol)
        [HttpPost("{id}/permisos")]
        public async Task<IActionResult> AssignPermisos(string id, [FromBody] List<int> permisoIds)
        {
            var role = await _roleManager.FindByIdAsync(id);
            if (role == null || role.IsDeleted) return NotFound();

            // Eliminar asignaciones actuales
            var existing = await _db.RolPermisos.Where(rp => rp.RolId == id).ToListAsync();
            _db.RolPermisos.RemoveRange(existing);

            // Agregar las nuevas
            var nuevos = permisoIds.Distinct().Select(pid => new RolPermiso
            {
                RolId     = id,
                PermisoId = pid,
                IsActive  = true,
                CreatedBy = UserId,
                CreatedAt = DateTimeOffset.UtcNow
            });
            await _db.RolPermisos.AddRangeAsync(nuevos);
            await _db.SaveChangesAsync();

            return Ok(new { assigned = permisoIds.Count });
        }
    }

    public record RoleRequest(string Name, string? Descripcion = null, bool IsActive = true);
}
