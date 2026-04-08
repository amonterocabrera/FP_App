import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Rol {
  id?: string;
  name: string;
  descripcion?: string;
  isActive: boolean;
  permisos?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/roles`;

  getRoles(isActive?: boolean): Observable<Rol[]> {
    let url = this.apiUrl;
    if (isActive !== undefined) {
      url += `?isActive=${isActive}`;
    }
    return this.http.get<Rol[]>(url);
  }

  getRole(id: string): Observable<Rol> {
    return this.http.get<Rol>(`${this.apiUrl}/${id}`);
  }

  createRole(role: any): Observable<Rol> {
    return this.http.post<Rol>(this.apiUrl, role);
  }

  updateRole(id: string, role: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, role);
  }

  deleteRole(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  toggleStatus(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle`, {});
  }

  assignPermisos(roleId: string, permisoIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${roleId}/permisos`, permisoIds);
  }
}
