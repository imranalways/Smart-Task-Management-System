import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import { inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  catchError,
  finalize,
  shareReplay,
  switchMap,
  throwError
} from 'rxjs';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

const AUTH_RETRIED = new HttpContextToken<boolean>(() => false);

let refreshInFlight$: Observable<unknown> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isApiRequest = req.url.startsWith(environment.apiUrl);

  const isAuthEndpoint =
    /\/auth\/(login|register|refresh|logout)(\?|$)/i.test(req.url);

  const token = auth.getAccessToken();

  const authorizedRequest = isApiRequest && token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  if (!isApiRequest || isAuthEndpoint) {
    return next(authorizedRequest);
  }

  return next(authorizedRequest).pipe(
    catchError(error => {

      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        req.context.get(AUTH_RETRIED)
      ) {
        return throwError(() => error);
      }

      if (!auth.getRefreshToken()) {
        auth.clearSession();
        void router.navigate(['/auth/login']);

        return throwError(() => error);
      }

      if (!refreshInFlight$) {
        refreshInFlight$ = auth.refreshToken().pipe(
          shareReplay({
            bufferSize: 1,
            refCount: false
          }),
          finalize(() => refreshInFlight$ = null)
        );
      }

      return refreshInFlight$.pipe(
        switchMap(() => {

          const refreshedToken = auth.getAccessToken();

          if (!refreshedToken) {
            auth.clearSession();
            return throwError(() => error);
          }

          return next(
            req.clone({
              context: req.context.set(AUTH_RETRIED, true),
              setHeaders: {
                Authorization: `Bearer ${refreshedToken}`
              }
            })
          );
        }),

        catchError(refreshError => {
          auth.clearSession();
          void router.navigate(['/auth/login']);

          return throwError(() => refreshError);
        })
      );
    })
  );
};