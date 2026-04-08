using GestionElectoral.Domain.Entities.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GestionElectoral.Infrastructure.Persistence.Configurations
{
    public class SecurityConfiguration : IEntityTypeConfiguration<Modulo>, IEntityTypeConfiguration<Permiso>, IEntityTypeConfiguration<RolPermiso>
    {
        public void Configure(EntityTypeBuilder<Modulo> builder)
        {
            builder.HasQueryFilter(x => !x.IsDeleted);
            builder.Property(m => m.Nombre).IsRequired().HasMaxLength(150);
            builder.Property(m => m.Ruta).IsRequired().HasMaxLength(250);
        }

        public void Configure(EntityTypeBuilder<Permiso> builder)
        {
            builder.HasQueryFilter(x => !x.IsDeleted);
            builder.Property(p => p.Nombre).IsRequired().HasMaxLength(150);
            builder.Property(p => p.Clave).IsRequired().HasMaxLength(100);
            builder.HasIndex(p => p.Clave).IsUnique(); // 'personas.create' debe ser unico

            // One To Many
            builder.HasOne(p => p.Modulo)
                   .WithMany(m => m.Permisos)
                   .HasForeignKey(p => p.ModuloId)
                   .OnDelete(DeleteBehavior.Cascade);
        }

        public void Configure(EntityTypeBuilder<RolPermiso> builder)
        {
            builder.HasQueryFilter(x => !x.IsDeleted);
            builder.HasKey(rp => new { rp.RolId, rp.PermisoId });

            builder.HasOne(rp => rp.Rol)
                   .WithMany()
                   .HasForeignKey(rp => rp.RolId);

            builder.HasOne(rp => rp.Permiso)
                   .WithMany(p => p.RolPermisos)
                   .HasForeignKey(rp => rp.PermisoId);
        }
    }
}
