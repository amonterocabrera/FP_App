using GestionElectoral.Domain.Entities.Core;
using GestionElectoral.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GestionElectoral.Infrastructure.Persistence.Configurations
{
    /// <summary>
    /// Configuración EF Core para Persona y PersonaContacto.
    /// </summary>
    public class PersonaConfiguration :
        IEntityTypeConfiguration<Persona>,
        IEntityTypeConfiguration<PersonaContacto>
    {
        public void Configure(EntityTypeBuilder<Persona> builder)
        {
            builder.HasQueryFilter(x => !x.IsDeleted);
            builder.HasKey(p => p.Id);

            builder.Property(p => p.Cedula).IsRequired().HasMaxLength(20);
            builder.HasIndex(p => p.Cedula).IsUnique(); // Cédula única a nivel nacional

            builder.Property(p => p.Nombre).IsRequired().HasMaxLength(150);
            builder.Property(p => p.Apellido).IsRequired().HasMaxLength(150);
            builder.Property(p => p.Email).HasMaxLength(256);
            builder.Property(p => p.Direccion).HasMaxLength(500);

            // Persona → PersonaContacto (1 a N)
            builder.HasMany(p => p.Contactos)
                   .WithOne(c => c.Persona)
                   .HasForeignKey(c => c.PersonaId)
                   .OnDelete(DeleteBehavior.Cascade); // Si se elimina Persona, se eliminan sus contactos
        }

        public void Configure(EntityTypeBuilder<PersonaContacto> builder)
        {
            builder.HasQueryFilter(x => !x.IsDeleted);
            builder.HasKey(c => c.Id);

            // El valor del contacto (número, handle, etc.)
            builder.Property(c => c.Valor).IsRequired().HasMaxLength(50);
            builder.Property(c => c.Nota).HasMaxLength(300);

            // Guardar enum como entero en BD (comportamiento por defecto de EF)
            builder.Property(c => c.Tipo)
                   .IsRequired()
                   .HasConversion<int>(); // TipoContacto → int en SQL

            // Índice: no duplicar el mismo número+tipo para la misma persona
            builder.HasIndex(c => new { c.PersonaId, c.Tipo, c.Valor })
                   .IsUnique()
                   .HasDatabaseName("IX_PersonaContacto_Unique");

            // Auditoría
            builder.Property(c => c.CreatedBy).HasMaxLength(450);
            builder.Property(c => c.UpdatedBy).HasMaxLength(450);
        }
    }
}
