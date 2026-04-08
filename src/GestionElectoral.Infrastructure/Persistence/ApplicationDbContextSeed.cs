using System.Threading.Tasks;
using GestionElectoral.Domain.Entities.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace GestionElectoral.Infrastructure.Persistence
{
    public static class ApplicationDbContextSeed
    {
        public static async Task SeedDefaultUserAsync(UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager)
        {
            var adminRole = new ApplicationRole { Name = "Administrator", Descripcion = "Administrador del Sistema" };

            if (roleManager.Roles.All(r => r.Name != adminRole.Name))
            {
                await roleManager.CreateAsync(adminRole);
            }

            var defaultUser = new ApplicationUser 
            { 
                UserName = "admin@gestionelectoral.com", 
                Email = "admin@gestionelectoral.com",
                Nombre = "Super",
                Apellido = "Admin",
                IsActive = true
            };

            var existingUser = userManager.Users.FirstOrDefault(u => u.UserName == defaultUser.UserName);
            if (existingUser == null)
            {
                var result = await userManager.CreateAsync(defaultUser, "Admin123*");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(defaultUser, adminRole.Name);
                }
            }
            else
            {
                // Force reset password and unlock in dev
                var token = await userManager.GeneratePasswordResetTokenAsync(existingUser);
                await userManager.ResetPasswordAsync(existingUser, token, "Admin123*");
                await userManager.ResetAccessFailedCountAsync(existingUser);
                await userManager.UpdateAsync(existingUser);
            }
        }

        public static async Task SeedModulosYPermisosAsync(ApplicationDbContext context, RoleManager<ApplicationRole> roleManager)
        {
            if (!context.Modulos.Any())
            {
                var moduloUsuarios = new GestionElectoral.Domain.Entities.Security.Modulo { Nombre = "Gestión de Usuarios", Ruta = "/users", Orden = 1, IsActive = true, Icono = "people-outline" };
                var moduloRoles = new GestionElectoral.Domain.Entities.Security.Modulo { Nombre = "Gestión de Roles", Ruta = "/roles", Orden = 2, IsActive = true, Icono = "shield-checkmark-outline" };
                
                context.Modulos.AddRange(moduloUsuarios, moduloRoles);
                await context.SaveChangesAsync();

                var permisosUsuarios = new[] {
                    new GestionElectoral.Domain.Entities.Security.Permiso { ModuloId = moduloUsuarios.Id, Nombre = "Crear Usuarios", Clave = "usuarios.crear", Accion = (GestionElectoral.Domain.Enums.AccionPermiso)1, IsActive = true },
                    new GestionElectoral.Domain.Entities.Security.Permiso { ModuloId = moduloUsuarios.Id, Nombre = "Editar Usuarios", Clave = "usuarios.editar", Accion = (GestionElectoral.Domain.Enums.AccionPermiso)2, IsActive = true },
                    new GestionElectoral.Domain.Entities.Security.Permiso { ModuloId = moduloUsuarios.Id, Nombre = "Eliminar Usuarios", Clave = "usuarios.eliminar", Accion = (GestionElectoral.Domain.Enums.AccionPermiso)3, IsActive = true }
                };

                var permisosRoles = new[] {
                    new GestionElectoral.Domain.Entities.Security.Permiso { ModuloId = moduloRoles.Id, Nombre = "Crear Roles", Clave = "roles.crear", Accion = (GestionElectoral.Domain.Enums.AccionPermiso)1, IsActive = true },
                    new GestionElectoral.Domain.Entities.Security.Permiso { ModuloId = moduloRoles.Id, Nombre = "Editar Roles", Clave = "roles.editar", Accion = (GestionElectoral.Domain.Enums.AccionPermiso)2, IsActive = true },
                    new GestionElectoral.Domain.Entities.Security.Permiso { ModuloId = moduloRoles.Id, Nombre = "Eliminar Roles", Clave = "roles.eliminar", Accion = (GestionElectoral.Domain.Enums.AccionPermiso)3, IsActive = true }
                };

                context.Permisos.AddRange(permisosUsuarios);
                context.Permisos.AddRange(permisosRoles);
                await context.SaveChangesAsync();
            }

            // Bind all permissions to Administrator role
            var adminRole = await roleManager.FindByNameAsync("Administrator");
            if (adminRole != null)
            {
                var allPermisos = context.Permisos.ToList();
                var currentAdminPermisos = context.RolPermisos.Where(rp => rp.RolId == adminRole.Id).Select(rp => rp.PermisoId).ToList();
                
                foreach (var p in allPermisos)
                {
                    if (!currentAdminPermisos.Contains(p.Id))
                    {
                        context.RolPermisos.Add(new GestionElectoral.Domain.Entities.Security.RolPermiso { RolId = adminRole.Id, PermisoId = p.Id });
                    }
                }
                await context.SaveChangesAsync();
            }
        }
    }
}
