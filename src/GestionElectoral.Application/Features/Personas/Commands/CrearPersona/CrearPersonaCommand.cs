using FluentValidation;
using GestionElectoral.Domain.Enums;
using MediatR;

namespace GestionElectoral.Application.Features.Personas.Commands.CrearPersona
{
    // ── Command ──────────────────────────────────────────────────────────────────

    /// <summary>
    /// Crea una Persona en GestionElectoral usando datos consultados del PadronJCE.
    /// La foto NO se almacena aquí — siempre se consulta dinámicamente.
    /// </summary>
    public class CrearPersonaCommand : IRequest<CrearPersonaResult>
    {
        /// <summary>Cédula del ciudadano (se buscará en PadronJCE).</summary>
        public string Cedula { get; set; } = string.Empty;

        // Campos opcionales que el operador puede agregar/completar
        public string? Email { get; set; }
        public string? Direccion { get; set; }

        /// <summary>Contactos iniciales (teléfonos, WhatsApp, etc.).</summary>
        public List<ContactoInputDto> Contactos { get; set; } = new();
    }

    public class ContactoInputDto
    {
        public TipoContacto Tipo { get; set; }
        public string Valor { get; set; } = string.Empty;
        public bool EsPrincipal { get; set; }
        public string? Nota { get; set; }
    }

    public record CrearPersonaResult(Guid Id, string Cedula, string NombreCompleto);

    // ── Validator ────────────────────────────────────────────────────────────────

    public class CrearPersonaCommandValidator : AbstractValidator<CrearPersonaCommand>
    {
        public CrearPersonaCommandValidator()
        {
            RuleFor(x => x.Cedula)
                .NotEmpty().WithMessage("La cédula es requerida.")
                .MaximumLength(20);

            RuleFor(x => x.Email)
                .EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email))
                .WithMessage("El formato del email no es válido.");

            RuleForEach(x => x.Contactos).ChildRules(c =>
            {
                c.RuleFor(x => x.Valor)
                    .NotEmpty().WithMessage("El valor del contacto no puede estar vacío.")
                    .MaximumLength(50);
            });
        }
    }
}
