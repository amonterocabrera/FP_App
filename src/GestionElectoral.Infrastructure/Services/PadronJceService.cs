using Dapper;
using GestionElectoral.Application.Common.Interfaces;
using GestionElectoral.Application.Features.Personas.Queries.BuscarEnPadron;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Text.RegularExpressions;

namespace GestionElectoral.Infrastructure.Services
{
    /// <summary>
    /// Implementación de acceso de SOLO LECTURA a la base de datos PadronJCE.
    /// Usa Dapper para consultas directas y eficientes.
    /// NUNCA escribe, modifica ni elimina datos en PadronJCE.
    /// </summary>
    public class PadronJceService : IPadronJceService
    {
        private readonly string _connectionString;

        public PadronJceService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("PadronJCEConnection")
                ?? throw new InvalidOperationException(
                    "La cadena de conexión 'PadronJCEConnection' no está configurada.");
        }

        // ── Normalización de cédula ───────────────────────────────────────────────
        // Las cédulas en PadronJCE pueden estar en formato:
        //   Con guiones:    402-2850584-4   (11 dígitos + 2 guiones = 13 chars)
        //   Sin guiones:    40228505844     (11 dígitos)
        // Intentamos ambos formatos para garantizar el match.

        private static string NormalizarSinGuiones(string cedula)
            => Regex.Replace(cedula.Trim(), @"[^0-9]", "");

        private static string NormalizarConGuiones(string soloDigitos)
        {
            if (soloDigitos.Length == 11)
                return $"{soloDigitos[..3]}-{soloDigitos[3..10]}-{soloDigitos[10]}";
            return soloDigitos;
        }

        // ── Búsqueda de ciudadano ─────────────────────────────────────────────────

        /// <inheritdoc/>
        public async Task<PadronCiudadanoDto?> BuscarPorCedulaAsync(
            string cedula,
            CancellationToken ct = default)
        {
            var sinGuiones = NormalizarSinGuiones(cedula);
            var conGuiones = NormalizarConGuiones(sinGuiones);

            // Busca con ambos formatos en una sola consulta
            const string sql = """
                SELECT TOP 1
                    Cedula,
                    Nombres,
                    Apellido1,
                    Apellido2,
                    IdSexo,
                    FechaNacimiento
                FROM [dbo].[padron]
                WHERE Cedula = @SinGuiones
                   OR Cedula = @ConGuiones
                """;

            await using var conn = new SqlConnection(_connectionString);

            var result = await conn.QueryFirstOrDefaultAsync<PadronCiudadanoDto>(
                new CommandDefinition(sql,
                    new { SinGuiones = sinGuiones, ConGuiones = conGuiones },
                    cancellationToken: ct));

            return result;
        }

        // ── Foto dinámica ─────────────────────────────────────────────────────────

        /// <inheritdoc/>
        public async Task<byte[]?> ObtenerFotoAsync(
            string cedula,
            CancellationToken ct = default)
        {
            var sinGuiones = NormalizarSinGuiones(cedula);
            var conGuiones = NormalizarConGuiones(sinGuiones);

            const string sql = """
                SELECT TOP 1 Imagen
                FROM [dbo].[Fotos]
                WHERE cedula = @SinGuiones
                   OR cedula = @ConGuiones
                """;

            await using var conn = new SqlConnection(_connectionString);

            var imagen = await conn.QueryFirstOrDefaultAsync<byte[]>(
                new CommandDefinition(sql,
                    new { SinGuiones = sinGuiones, ConGuiones = conGuiones },
                    cancellationToken: ct));

            return imagen;
        }
        // ── Diagnóstico (solo desarrollo) ─────────────────────────────────────────

        /// <summary>
        /// Retorna información de diagnóstico del PadronJCE:
        /// muestra los primeros 3 registros de la tabla padron tal como están,
        /// y verifica si la cédula buscada existe con LIKE.
        /// </summary>
        public async Task<object> DiagnosticarAsync(string cedula, CancellationToken ct = default)
        {
            await using var conn = new SqlConnection(_connectionString);

            // 1. Primeros 3 registros para ver el formato real
            var muestras = await conn.QueryAsync<dynamic>(
                new CommandDefinition(
                    "SELECT TOP 3 Cedula, Nombres, Apellido1 FROM [dbo].[padron]",
                    cancellationToken: ct));

            // 2. Busca con LIKE (contiene los dígitos)
            var soloDigitos = NormalizarSinGuiones(cedula);
            var porLike = await conn.QueryFirstOrDefaultAsync<dynamic>(
                new CommandDefinition(
                    "SELECT TOP 1 Cedula, Nombres, Apellido1 FROM [dbo].[padron] WHERE Cedula LIKE @Pattern",
                    new { Pattern = $"%{soloDigitos}%" },
                    cancellationToken: ct));

            // 3. Cuenta total de registros
            var total = await conn.ExecuteScalarAsync<int>(
                new CommandDefinition("SELECT COUNT(*) FROM [dbo].[padron]", cancellationToken: ct));

            return new
            {
                TotalRegistros   = total,
                MuestrasFormato  = muestras,
                BusquedaLike     = porLike,
                CedulaBuscada    = cedula,
                CedulaSinGuiones = soloDigitos,
                CedulaConGuiones = NormalizarConGuiones(soloDigitos)
            };
        }
    }
}
