import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── DTOs de respuesta (alineados con el backend refactorizado) ────────────────

export interface Persona {
  id?: string;
  cedula: string;
  nombre: string;
  apellido: string;
  nombreCompleto?: string;
  fechaNacimiento?: string;
  genero: string;
  email?: string;
  direccion?: string;
  fotoUrl?: string;
  isActive: boolean;
  contactos?: ContactoDto[];
}

export interface ContactoDto {
  id?: number;
  tipo: number;
  tipoNombre?: string;
  valor: string;
  esPrincipal: boolean;
  nota?: string;
}

export interface PersonasResult {
  items: Persona[];
  total: number;
  pagina: number;
  tamPagina: number;
}

// ── Payloads de request ───────────────────────────────────────────────────────

export interface CrearPersonaRequest {
  cedula: string;
  email?: string;
  direccion?: string;
  contactos?: ContactoInputDto[];
  nombre?: string;
  apellido?: string;
  genero?: string;
  fechaNacimiento?: string;
}

export interface ActualizarPersonaRequest {
  email?: string;
  direccion?: string;
  contactos?: ContactoInputDto[];
}

export interface ContactoInputDto {
  tipo: number;
  valor: string;
  esPrincipal: boolean;
  nota?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PersonasService {
  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/personas`;

  getPersonas(
    busqueda: string = '',
    pagina: number   = 1,
    tamPagina: number = 20
  ): Observable<PersonasResult> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamPagina', tamPagina.toString());

    if (busqueda) params = params.set('busqueda', busqueda);

    return this.http.get<PersonasResult>(this.apiUrl, { params });
  }

  getMisRegistros(
    busqueda: string = '',
    pagina: number   = 1,
    tamPagina: number = 1000
  ): Observable<PersonasResult> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamPagina', tamPagina.toString());

    if (busqueda) params = params.set('busqueda', busqueda);

    return this.http.get<PersonasResult>(`${this.apiUrl}/mis-registros`, { params });
  }

  getPersona(id: string): Observable<Persona> {
    return this.http.get<Persona>(`${this.apiUrl}/${id}`);
  }

  getPersonaByCedula(cedula: string): Observable<Persona> {
    return this.http.get<Persona>(`${this.apiUrl}/por-cedula/${cedula}`);
  }

  createPersona(payload: CrearPersonaRequest): Observable<{ id: string; cedula: string; nombreCompleto: string }> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  updatePersona(id: string, payload: ActualizarPersonaRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, payload);
  }

  deletePersona(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
