using AutoMapper;
using GestionElectoral.Domain.Entities.Core;

namespace GestionElectoral.Application.Features.Personas.Queries.GetPersonas
{
    public class PersonaMappingProfile : Profile
    {
        public PersonaMappingProfile()
        {
            CreateMap<Persona, PersonaDto>();
            CreateMap<PersonaContacto, ContactoDto>();
        }
    }
}
