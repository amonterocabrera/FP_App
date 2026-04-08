using System.Security.Claims;
using GestionElectoral.Application.Common.Interfaces;
using GestionElectoral.Application.Features.Personas.Commands.CrearPersona;
using GestionElectoral.Application.Features.Personas.Queries.BuscarEnPadron;
using GestionElectoral.Application.Features.Personas.Queries.GetPersonaById;
using GestionElectoral.Application.Features.Personas.Queries.GetPersonas;
using GestionElectoral.Domain.Entities.Core;
using GestionElectoral.Domain.Enums;
using GestionElectoral.Infrastructure.Persistence;
using MediatR;
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
        private readonly ISender _mediator;
        private readonly IPadronJceService _padron;
        private readonly ApplicationDbContext _db;

        private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        public PersonasController(
            ISender mediator,
            IPadronJceService padron,
            ApplicationDbContext db)
        {
            _mediator = mediator;
            _padron   = padron;
            _db       = db;
        }

        // ── 1. Buscar en PadronJCE (solo lectura) ────────────────────────────────

        /// <summary>
        /// Busca un ciudadano en el PadronJCE por cédula.
        /// Solo consulta — no crea ni modifica nada en GestionElectoral.
        /// Usado para prellenar el formulario de registro.
        /// </summary>
        [HttpGet("buscar-padron/{cedula}")]
        public async Task<IActionResult> BuscarEnPadron(string cedula, CancellationToken ct)
        {
            try
            {
                var result = await _mediator.Send(new BuscarEnPadronQuery(cedula), ct);
                return result is null
                    ? NotFound(new { error = $"Cédula '{cedula}' no encontrada en el PadronJCE." })
                    : Ok(result);
            }
            catch (Exception ex)
            {
                // Expone el error de conexión/BD en desarrollo para facilitar diagnóstico
                return StatusCode(500, new
                {
                    error = "Error al consultar el PadronJCE.",
                    detalle = ex.Message   // quitar en producción
                });
            }
        }

        // ── 1b. DIAGNÓSTICO — ver formato real de cédulas en PadronJCE ────────────
        // Remover en producción

        [HttpGet("diagnostico/{cedula}")]
        public async Task<IActionResult> Diagnostico(string cedula, CancellationToken ct)
        {
            try
            {
                var result = await _padron.DiagnosticarAsync(cedula, ct);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, innerError = ex.InnerException?.Message });
            }
        }

        // ── 2. Foto dinámica desde PadronJCE ─────────────────────────────────────

        /// <summary>
        /// Retorna la fotografía del ciudadano consultada en tiempo real desde PadronJCE.
        /// La foto NUNCA se almacena en GestionElectoral.
        /// </summary>
        [HttpGet("{cedula}/foto")]
        public async Task<IActionResult> ObtenerFoto(string cedula, CancellationToken ct)
        {
            var foto = await _padron.ObtenerFotoAsync(cedula, ct);
            if (foto is null || foto.Length == 0)
                return NotFound(new { error = $"No hay foto registrada para la cédula '{cedula}'." });

            return File(foto, "image/jpeg");
        }

        // ── 3. Listar personas registradas (paginado) ────────────────────────────

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? busqueda,
            [FromQuery] int pagina = 1,
            [FromQuery] int tamPagina = 20,
            CancellationToken ct = default)
        {
            var result = await _mediator.Send(
                new GetPersonasQuery(busqueda, pagina, tamPagina), ct);
            return Ok(result);
        }

        // ── 4. Obtener persona por ID ─────────────────────────────────────────────

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        {
            var result = await _mediator.Send(new GetPersonaByIdQuery(id), ct);
            return result is null ? NotFound() : Ok(result);
        }

        // ── 5. Crear persona (lee del PadronJCE, escribe en GestionElectoral) ────

        /// <summary>
        /// Registra una nueva persona. Obtiene los datos base del PadronJCE
        /// usando la cédula y los persiste en GestionElectoral junto con
        /// los datos de contacto proporcionados por el operador.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Crear(
            [FromBody] CrearPersonaCommand command,
            CancellationToken ct)
        {
            try
            {
                var result = await _mediator.Send(command, ct);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
        }

        // ── 6. Actualizar datos editables de la persona ───────────────────────────

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ActualizarPersonaRequest req)
        {
            var persona = await _db.Personas
                .Include(p => p.Contactos)
                .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);

            if (persona is null) return NotFound();

            // Solo actualizamos los campos que el operador puede modificar
            // (nombre/apellido vienen del PadronJCE y no se tocan aquí)
            persona.Email     = req.Email?.Trim();
            persona.Direccion = req.Direccion?.Trim();
            persona.UpdatedBy = UserId;
            persona.UpdatedAt = DateTimeOffset.UtcNow;

            // Reemplazar contactos (soft-delete + nuevos)
            foreach (var c in persona.Contactos.Where(c => !c.IsDeleted))
            {
                c.IsDeleted = true;
                c.UpdatedAt = DateTimeOffset.UtcNow;
                c.UpdatedBy = UserId;
            }

            foreach (var c in req.Contactos ?? [])
            {
                persona.Contactos.Add(new PersonaContacto
                {
                    PersonaId   = persona.Id,
                    Tipo        = c.Tipo,
                    Valor       = c.Valor.Trim(),
                    EsPrincipal = c.EsPrincipal,
                    Nota        = c.Nota?.Trim(),
                    CreatedBy   = UserId,
                    IsActive    = true,
                    IsDeleted   = false,
                });
            }

            await _db.SaveChangesAsync();
            return NoContent();
        }

        // ── 7. Eliminar (soft-delete) ─────────────────────────────────────────────

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var persona = await _db.Personas.FindAsync(id);
            if (persona is null) return NotFound();

            persona.IsDeleted = true;
            persona.UpdatedBy = UserId;
            persona.UpdatedAt = DateTimeOffset.UtcNow;

            await _db.SaveChangesAsync();
            return NoContent();
        }
    }

    // ── Request models para los endpoints no-CQRS ─────────────────────────────

    public record ContactoRequest(
        TipoContacto Tipo,
        string Valor,
        bool EsPrincipal,
        string? Nota);

    public record ActualizarPersonaRequest(
        string? Email,
        string? Direccion,
        List<ContactoRequest>? Contactos);
}
