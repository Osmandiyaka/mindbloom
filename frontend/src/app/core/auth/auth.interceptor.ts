import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, from } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const isAuthEndpoint =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/logout') ||
    req.url.includes('/auth/forgot-password') ||
    req.url.includes('/auth/reset-password');

  const token = authService.getAccessToken();
  if (token && !isAuthEndpoint) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        return from(authService.refresh()).pipe(
          switchMap((success) => {
            if (!success) {
              authService.logout('session_expired');
              return throwError(() => error);
            }

            const newToken = authService.getAccessToken();
            if (!newToken) {
              return throwError(() => error);
            }

            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });

            return next(retryReq);
          }),
          catchError((refreshError) => {
            authService.logout('session_expired');
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
