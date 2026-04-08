using GestionElectoral.Application;
using GestionElectoral.Infrastructure;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS for Angular and Mobile (Ionic)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

// Seed Default User
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var userManager = services.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<GestionElectoral.Domain.Entities.Identity.ApplicationUser>>();
        var roleManager = services.GetRequiredService<Microsoft.AspNetCore.Identity.RoleManager<GestionElectoral.Domain.Entities.Identity.ApplicationRole>>();
        var dbContext = services.GetRequiredService<GestionElectoral.Infrastructure.Persistence.ApplicationDbContext>();
        
        await GestionElectoral.Infrastructure.Persistence.ApplicationDbContextSeed.SeedDefaultUserAsync(userManager, roleManager);
        await GestionElectoral.Infrastructure.Persistence.ApplicationDbContextSeed.SeedModulosYPermisosAsync(dbContext, roleManager);
    }
    catch (System.Exception ex)
    {
        var logger = services.GetRequiredService<Microsoft.Extensions.Logging.ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
