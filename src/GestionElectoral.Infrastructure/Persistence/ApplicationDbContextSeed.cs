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

            if (userManager.Users.All(u => u.UserName != defaultUser.UserName))
            {
                var result = await userManager.CreateAsync(defaultUser, "Admin123*");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(defaultUser, adminRole.Name);
                }
            }
        }
    }
}
