import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthResult, UserSession, ValidationStatus } from '../models/auth.models';
import { TokenStorageService } from './token-storage.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`; 

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService
  ) {}

  login(credentials: { email: string, password: string, rememberMe?: boolean }): Observable<AuthResult> {
    return this.http.post<AuthResult>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res.succeeded && res.token) {
          this.tokenStorage.saveToken(res.token);
          this.tokenStorage.saveRefreshToken(res.refreshToken!);
          if (res.user) {
            this.tokenStorage.saveUser(res.user);
          }
        }
      })
    );
  }

  refreshToken(token: string, refreshToken: string): Observable<AuthResult> {
    return this.http.post<AuthResult>(`${this.apiUrl}/refresh`, { token, refreshToken });
  }

  logout(): void {
    // Attempt backend logout to clear refresh token, ignoring result
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => {},
      error: () => {}
    });
    this.tokenStorage.signOut();
  }

  getMe(): Observable<UserSession> {
    return this.http.get<UserSession>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        this.tokenStorage.saveUser(user);
      })
    );
  }

  changePassword(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, data);
  }

  public isAuthenticated(): boolean {
    const token = this.tokenStorage.getToken();
    return !!token;
  }

  public getCurrentUser(): UserSession | null {
    return this.tokenStorage.getUser();
  }

  public hasPermission(permissionKey: string): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.permisos) return false;
    return user.permisos.includes(permissionKey);
  }

  public getValidationStatus(): ValidationStatus {
    const user = this.getCurrentUser();
    return user?.identityValidationStatus || ValidationStatus.Pending;
  }

  public verifyIdentityDocument(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('documentImage', file);
    return this.http.post<any>(`${environment.apiUrl}/identityvalidation/verify`, formData);
  }
}
