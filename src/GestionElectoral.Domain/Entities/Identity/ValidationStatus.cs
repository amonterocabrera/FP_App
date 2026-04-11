using System;

namespace GestionElectoral.Domain.Entities.Identity
{
    public enum ValidationStatus
    {
        Pending = 1,   // El usuario nunca ha validado (Primer login).
        Approved = 2,  // Validación superada. Flujo normal.
        Rejected = 3   // N8n rechazó la cédula (borrosa, no coincide, etc).
    }
}
