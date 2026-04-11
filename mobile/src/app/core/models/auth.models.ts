export enum ValidationStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3
}

export interface UserSession {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  roles: string[];
  permisos: string[];
  modulos: ModuloSession[];
  identityValidationStatus: ValidationStatus;
}

export interface ModuloSession {
  id: number;
  nombre: string;
  ruta: string;
  icono?: string;
  orden: number;
}

export interface AuthResult {
  succeeded: boolean;
  token?: string;
  refreshToken?: string;
  errors: string[];
  mustChangePassword?: boolean;
  user?: UserSession;
}
