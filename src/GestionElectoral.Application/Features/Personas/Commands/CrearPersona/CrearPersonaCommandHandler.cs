using GestionElectoral.Application.Common.Interfaces;
using GestionElectoral.Domain.Entities.Core;
using GestionElectoral.Domain.Enums;
using MediatR;

namespace GestionElectoral.Application.Features.Personas.Commands.CrearPersona
{
    public class CrearPersonaCommandHandler : IRequestHandler<CrearPersonaCommand, CrearPersonaResult>
    {
        private readonly IPersonaRepository _repo;
        private readonly IPadronJceService  _padron;

        public CrearPersonaCommandHandler(IPersonaRepository repo, IPadronJceService padron)
        {
            _repo   = repo;
            _padron = padron;
        }

        public async Task<CrearPersonaResult> Handle(
            CrearPersonaCommand request,
            CancellationToken cancellationToken)
        {
            // 1. Verificar que la cédula no esté ya registrada
            if (await _repo.ExistePorCedulaAsync(request.Cedula, cancellationToken))
                throw new InvalidOperationException(
                    $"La cédula '{request.Cedula}' ya está registrada en el sistema.");

            // 2. Consultar datos del ciudadano en PadronJCE (SOLO LECTURA)
            var ciudadano = await _padron.BuscarPorCedulaAsync(request.Cedula, cancellationToken);
            
            if (ciudadano == null && (string.IsNullOrWhiteSpace(request.Nombre) || string.IsNullOrWhiteSpace(request.Apellido)))
            {
                 throw new KeyNotFoundException($"La cédula '{request.Cedula}' no fue encontrada en el PadronJCE y no se proporcionaron datos manuales.");
            }

            // 3. Construir la entidad Persona con datos del padrón o datos manuales
            var persona = new Persona
            {
                Id              = Guid.NewGuid(),
                Cedula          = ciudadano?.Cedula ?? request.Cedula,
                Nombre          = ciudadano?.Nombres ?? request.Nombre!.Trim(),
                Apellido        = ciudadano != null ? $"{ciudadano.Apellido1} {ciudadano.Apellido2}".Trim() : request.Apellido!.Trim(),
                FechaNacimiento = ciudadano?.FechaNacimiento ?? request.FechaNacimiento,
                Genero          = ciudadano != null ? (ciudadano.IdSexo == "2" || ciudadano.IdSexo?.ToUpper() == "F" ? Genero.F : Genero.M) : request.Genero ?? Genero.M,
                Email           = request.Email?.Trim(),
                Direccion       = request.Direccion?.Trim(),
                IsActive        = true,
                IsDeleted       = false,
            };

            // 4. Agregar contactos iniciales
            foreach (var c in request.Contactos)
            {
                persona.Contactos.Add(new PersonaContacto
                {
                    PersonaId   = persona.Id,
                    Tipo        = c.Tipo,
                    Valor       = c.Valor.Trim(),
                    EsPrincipal = c.EsPrincipal,
                    Nota        = c.Nota?.Trim(),
                    IsActive    = true,
                    IsDeleted   = false,
                });
            }

            // 5. Persistir en GestionElectoral (nunca escribe en PadronJCE)
            await _repo.GuardarAsync(persona, cancellationToken);

            return new CrearPersonaResult(
                persona.Id,
                persona.Cedula,
                $"{persona.Nombre} {persona.Apellido}".Trim());
        }
    }
}
