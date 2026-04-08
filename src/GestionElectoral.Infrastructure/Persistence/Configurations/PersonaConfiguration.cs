using GestionElectoral.Domain.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GestionElectoral.Infrastructure.Persistence.Configurations
{
    public class PersonaConfiguration : IEntityTypeConfiguration<Persona>
    {
        public void Configure(EntityTypeBuilder<Persona> builder)
        {
            // Global Query Filter to automatically exclude soft deleted records implicitly.
            builder.HasQueryFilter(x => !x.IsDeleted);

            builder.HasKey(p => p.Id);
            builder.Property(p => p.Cedula).IsRequired().HasMaxLength(20);
            builder.HasIndex(p => p.Cedula).IsUnique(); // Cedula as a Unique Field

            builder.Property(p => p.Nombre).IsRequired().HasMaxLength(150);
            builder.Property(p => p.Apellido).IsRequired().HasMaxLength(150);
            builder.Property(p => p.Email).HasMaxLength(150);
            builder.Property(p => p.Telefono).HasMaxLength(20);
            builder.Property(p => p.Direccion).HasMaxLength(500);
            
            // Enum mapping to specific type in SQL Server if needed, EF does this automatically usually by integer.
        }
    }
}
