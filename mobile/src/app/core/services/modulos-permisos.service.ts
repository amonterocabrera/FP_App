import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Modulo {
  id: number;
  nombre: string;
  descripcion?: string;
  ruta: string;
  icono?: string;
  orden: number;
  isActive: boolean;
  permisos?: Permiso[];
}

export interface Permiso {
  id: number;
  moduloId: number;
  modulo?: string;
  nombre: string;
  clave: string;
  accion: number;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ModulosPermisosService {
  private http = inject(HttpClient);
  private apiUrlModulos = `${environment.apiUrl}/modulos`;
  private apiUrlPermisos = `${environment.apiUrl}/permisos`;

  // Módulos
  getModulos(isActive?: boolean): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(`${this.apiUrlModulos}${isActive !== undefined ? `?isActive=${isActive}` : ''}`);
  }

  getModulo(id: number): Observable<Modulo> {
    return this.http.get<Modulo>(`${this.apiUrlModulos}/${id}`);
  }

  createModulo(data: any): Observable<Modulo> {
    return this.http.post<Modulo>(this.apiUrlModulos, data);
  }

  updateModulo(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrlModulos}/${id}`, data);
  }

  deleteModulo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrlModulos}/${id}`);
  }

  // Permisos
  getPermisos(moduloId?: number): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${this.apiUrlPermisos}${moduloId ? `?moduloId=${moduloId}` : ''}`);
  }

  getPermiso(id: number): Observable<Permiso> {
    return this.http.get<Permiso>(`${this.apiUrlPermisos}/${id}`);
  }

  createPermiso(data: any): Observable<Permiso> {
    return this.http.post<Permiso>(this.apiUrlPermisos, data);
  }

  updatePermiso(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrlPermisos}/${id}`, data);
  }

  deletePermiso(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrlPermisos}/${id}`);
  }
}
