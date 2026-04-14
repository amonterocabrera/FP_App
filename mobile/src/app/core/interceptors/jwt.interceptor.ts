import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { TokenStorageService } from '../services/token-storage.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const tokenService = inject(TokenStorageService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = tokenService.getToken();
  let authReq = req;

  // Don't intercept auth endpoints
  if (req.url.includes('/api/auth/login') || req.url.includes('/api/auth/refresh')) {
    return next(authReq);
  }

  if (token != null) {
    authReq = addTokenHeader(req, token);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 Unauthorized usually means token expired
      if (error.status === 401) {
        return handle401Error(authReq, next, authService, tokenService, router);
      }
      return throwError(() => error);
    })
  );
};

function addTokenHeader(request: HttpRequest<any>, token: string) {
  return request.clone({ headers: request.headers.set('Authorization', 'Bearer ' + token) });
}

function handle401Error(request: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService, tokenService: TokenStorageService, router: Router) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const token = tokenService.getToken();
    const refreshToken = tokenService.getRefreshToken();

    if (token && refreshToken) {
      return authService.refreshToken(token, refreshToken).pipe(
        switchMap((res: any) => {
          isRefreshing = false;
          if (res.succeeded && res.token) {
            tokenService.saveToken(res.token);
            tokenService.saveRefreshToken(res.refreshToken);
            refreshTokenSubject.next(res.token);
            return next(addTokenHeader(request, res.token));
          } else {
            // Refresh failed, logout
            tokenService.signOut();
            router.navigateByUrl('/home', { replaceUrl: true }); // Prevent white flash
            return throwError(() => new Error('Refresh token invalid'));
          }
        }),
        catchError((err) => {
          isRefreshing = false;
          tokenService.signOut();
          router.navigateByUrl('/home', { replaceUrl: true }); // Prevent white flash
          return throwError(() => err);
        })
      );
    } else {
       isRefreshing = false;
       tokenService.signOut();
       router.navigateByUrl('/home', { replaceUrl: true }); // Prevent white flash
       return throwError(() => new Error('No refresh token'));
    }
  } else {
    // Wait for the new token
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => {
        return next(addTokenHeader(request, token));
      })
    );
  }
}
