namespace GestionElectoral.Application.Common.Models
{
    public class AuthResult
    {
        public bool Succeeded { get; set; }
        public string? Token { get; set; }
        public string? RefreshToken { get; set; }
        public string[] Errors { get; set; } = [];
    }
}
