using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using GestionElectoral.Domain.Entities.Identity;
using GestionElectoral.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GestionElectoral.Application.Common.Interfaces;

namespace GestionElectoral.WebAPI.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IIdentityService _identityService;
        private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

        public UsersController(
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager,
            IIdentityService identityService)
        {
            _userManager   = userManager;
            _roleManager   = roleManager;
            _identityService = identityService;
        }

        // GET /api/users?search=&isActive=&page=1&pageSize=20
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] bool? isActive,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var query = _userManager.Users
                .Where(u => !u.IsDeleted);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(u =>
                    u.Nombre.Contains(search) ||
                    u.Apellido.Contains(search) ||
                    u.Email!.Contains(search));

            if (isActive.HasValue)
                query = query.Where(u => u.IsActive == isActive.Value);

            var total = await query.CountAsync();
            var items = await query
                .OrderBy(u => u.Apellido).ThenBy(u => u.Nombre)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var result = new List<object>();
            foreach (var u in items)
            {
                var roles = await _userManager.GetRolesAsync(u);
                result.Add(new
                {
                    u.Id, u.Nombre, u.Apellido, u.Email,
                    u.IsActive, u.MustChangePassword,
                    IsLockedOut = await _userManager.IsLockedOutAsync(u),
                    u.AccessFailedCount, u.CreatedAt,
                    Roles = roles
                });
            }

            return Ok(new { items = result, total, page, pageSize, totalPages = (int)Math.Ceiling(total / (double)pageSize) });
        }

        // GET /api/users/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var u = await _userManager.FindByIdAsync(id);
            if (u == null || u.IsDeleted) return NotFound();
            var roles = await _userManager.GetRolesAsync(u);
            return Ok(new
            {
                u.Id, u.Nombre, u.Apellido, u.Email, u.PhoneNumber,
                u.IsActive, u.MustChangePassword, u.PersonaId,
                IsLockedOut = await _userManager.IsLockedOutAsync(u),
                u.AccessFailedCount, u.LockoutEnd, u.CreatedAt, u.UpdatedAt,
                Roles = roles
            });
        }

        // POST /api/users
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (await _userManager.FindByEmailAsync(req.Email) != null)
                return Conflict(new { error = "El correo ya está registrado." });

            var user = new ApplicationUser
            {
                UserName          = req.Email,
                Email             = req.Email,
                Nombre            = req.Nombre,
                Apellido          = req.Apellido,
                PhoneNumber       = req.Telefono,
                PersonaId         = req.PersonaId,
                IsActive          = true,
                MustChangePassword = req.MustChangePassword,
                LockoutEnabled    = true,
                CreatedBy         = CurrentUserId
            };

            var result = await _userManager.CreateAsync(user, req.Password);
            if (!result.Succeeded)
                return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

            if (req.Roles?.Any() == true)
                await _userManager.AddToRolesAsync(user, req.Roles);

            return CreatedAtAction(nameof(GetById), new { id = user.Id }, new { user.Id });
        }

        // PUT /api/users/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateUserRequest req)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null || user.IsDeleted) return NotFound();

            user.Nombre      = req.Nombre;
            user.Apellido    = req.Apellido;
            user.PhoneNumber = req.Telefono;
            user.PersonaId   = req.PersonaId;
            user.IsActive    = req.IsActive;
            user.UpdatedBy   = CurrentUserId;
            user.UpdatedAt   = DateTimeOffset.UtcNow;

            await _userManager.UpdateAsync(user);
            return NoContent();
        }

        // DELETE /api/users/{id}  (soft delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null || user.IsDeleted) return NotFound();
            user.IsDeleted = true;
            user.IsActive  = false;
            user.UpdatedBy = CurrentUserId;
            user.UpdatedAt = DateTimeOffset.UtcNow;
            await _userManager.UpdateAsync(user);
            return NoContent();
        }

        // PATCH /api/users/{id}/toggle
        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> Toggle(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null || user.IsDeleted) return NotFound();
            user.IsActive  = !user.IsActive;
            user.UpdatedBy = CurrentUserId;
            user.UpdatedAt = DateTimeOffset.UtcNow;
            await _userManager.UpdateAsync(user);
            return Ok(new { user.IsActive });
        }

        // PATCH /api/users/{id}/unlock
        [HttpPatch("{id}/unlock")]
        public async Task<IActionResult> Unlock(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null || user.IsDeleted) return NotFound();
            await _userManager.SetLockoutEndDateAsync(user, null);
            await _userManager.ResetAccessFailedCountAsync(user);
            return Ok(new { message = "Usuario desbloqueado." });
        }

        // POST /api/users/{id}/roles
        [HttpPost("{id}/roles")]
        public async Task<IActionResult> AssignRoles(string id, [FromBody] List<string> roles)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null || user.IsDeleted) return NotFound();

            var current = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, current);

            var validRoles = roles.Where(r => _roleManager.RoleExistsAsync(r).Result).ToList();
            if (validRoles.Any())
                await _userManager.AddToRolesAsync(user, validRoles);

            return Ok(new { roles = validRoles });
        }

        // POST /api/users/{id}/reset-password   (admin)
        [HttpPost("{id}/reset-password")]
        public async Task<IActionResult> ResetPassword(string id, [FromBody] AdminResetPasswordRequest req)
        {
            var result = await _identityService.AdminResetPasswordAsync(id, req.NewPassword, req.MustChangePassword, CurrentUserId);
            return result.Succeeded ? Ok(new { message = "Contraseña restablecida." }) : BadRequest(new { errors = result.Errors });
        }
    }

    // ─── Request records ───
    public record CreateUserRequest(
        string Nombre, string Apellido,
        string Email, string Password,
        string? Telefono = null,
        Guid? PersonaId = null,
        bool MustChangePassword = true,
        List<string>? Roles = null);

    public record UpdateUserRequest(
        string Nombre, string Apellido,
        string? Telefono,
        Guid? PersonaId,
        bool IsActive);

    public record AdminResetPasswordRequest(string NewPassword, bool MustChangePassword = true);
}
