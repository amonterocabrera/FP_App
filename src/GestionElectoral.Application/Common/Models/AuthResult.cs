namespace GestionElectoral.Application.Common.Models
{
    public class AuthResult
    {
        public bool Succeeded { get; set; }
        public string? Token { get; set; }
        public string? RefreshToken { get; set; }
        public string[] Errors { get; set; } = [];

        /// <summary>Perfil del usuario para que el frontend lo persista en memoria.</summary>
        public UserSessionDto? User { get; set; }

        /// <summary>True cuando el usuario debe cambiar su contraseña antes de continuar.</summary>
        public bool MustChangePassword { get; set; }

        // Factory helper
        public static AuthResult Fail(params string[] errors) =>
            new() { Succeeded = false, Errors = errors };

        public static AuthResult Ok(string token, string refresh, bool mustChange, UserSessionDto user) =>
            new() { Succeeded = true, Token = token, RefreshToken = refresh, MustChangePassword = mustChange, User = user };
    }

    public class UserSessionDto
    {
        public string Id { get; set; } = default!;
        public string Nombre { get; set; } = default!;
        public string Apellido { get; set; } = default!;
        public string Email { get; set; } = default!;
        public List<string> Roles { get; set; } = new();
        public List<string> Permisos { get; set; } = new();       // ['usuarios.ver', 'roles.crear', ...]
        public List<ModuloSessionDto> Modulos { get; set; } = new(); // menú dynamic
    }

    public class ModuloSessionDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = default!;
        public string Ruta { get; set; } = default!;
        public string? Icono { get; set; }
        public int Orden { get; set; }
    }
}
