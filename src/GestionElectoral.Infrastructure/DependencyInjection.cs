using System.Text;
using GestionElectoral.Domain.Entities.Identity;
using GestionElectoral.Infrastructure.Persistence;
using GestionElectoral.Application.Common.Interfaces;
using GestionElectoral.Infrastructure.Persistence.Interceptors;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace GestionElectoral.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            // 1. Interceptors
            services.AddScoped<AuditableEntitySaveChangesInterceptor>();

            // 2. DbContext
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection"),
                    b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

            // 3. Identity
            services.AddIdentityCore<ApplicationUser>(options =>
            {
                // Política de contraseñas
                options.Password.RequireDigit = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = false;

                // Email único por usuario
                options.User.RequireUniqueEmail = true;

                // ✅ Lockout: bloquear tras 5 intentos por 15 minutos
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.AllowedForNewUsers = true;
            })
            .AddRoles<ApplicationRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

            // 4. Custom Application Services
            services.AddScoped<GestionElectoral.Application.Common.Interfaces.IIdentityService, GestionElectoral.Infrastructure.Services.IdentityService>();

            // 4b. PadronJCE — solo lectura, Dapper, conexión secundaria
            services.AddTransient<IPadronJceService, GestionElectoral.Infrastructure.Services.PadronJceService>();

            // 4c. Repositorios de dominio
            services.AddScoped<GestionElectoral.Application.Common.Interfaces.IPersonaRepository,
                               GestionElectoral.Infrastructure.Repositories.PersonaRepository>();

            // 5. Authentication (JWT)
            var jwtSecret = configuration["JwtSettings:Secret"] ?? "SuperSecretKeyForDevelopmentOnlyPleaseChangeLater__123456789";
            
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = false;
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSecret)),
                    ValidateIssuer = false, // Configurar para prod
                    ValidateAudience = false, // Configurar para prod
                    ClockSkew = TimeSpan.Zero
                };
            });

            return services;
        }
    }
}
