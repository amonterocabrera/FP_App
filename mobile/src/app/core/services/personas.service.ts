import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Persona {
  id?: string;
  cedula: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  genero: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  isActive: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PersonasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Personas`;

  getPersonas(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = '', includeDeleted: boolean = false): Observable<PaginatedResult<Persona>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString())
      .set('includeDeleted', includeDeleted.toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    return this.http.get<PaginatedResult<Persona>>(this.apiUrl, { params });
  }

  getPersona(id: string): Observable<Persona> {
    return this.http.get<Persona>(`${this.apiUrl}/${id}`);
  }

  createPersona(persona: Persona): Observable<Persona> {
    return this.http.post<Persona>(this.apiUrl, persona);
  }

  updatePersona(id: string, persona: Persona): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, persona);
  }

  deletePersona(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
