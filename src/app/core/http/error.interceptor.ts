import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { toast } from '@spartan-ng/brain/sonner';
import { catchError, throwError } from 'rxjs';

import { ApiError } from './api-error.model';

const GENERIC_ERROR_MESSAGE = 'Não foi possível completar a requisição. Tente novamente.';

// /auth/refresh também é chamado silenciosamente pelo authGuard (pra restaurar a sessão
// em abas novas/reloads, já que o accessToken só vive em memória). Falhar ali é o estado
// normal de "não está logado" e não deve virar um toast de erro visível.
const TOAST_EXEMPT_PATHS = ['/auth/refresh'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      const silent = TOAST_EXEMPT_PATHS.some((path) => req.url.includes(path));

      if (error instanceof HttpErrorResponse && isApiError(error.error)) {
        const apiError = error.error;
        if (!silent) {
          toast.error(resolveMessage(apiError));
        }
        return throwError(() => apiError);
      }

      if (!silent) {
        toast.error(GENERIC_ERROR_MESSAGE);
      }
      return throwError(() => error);
    }),
  );
};

function isApiError(body: unknown): body is ApiError {
  return typeof body === 'object' && body !== null && 'title' in body && 'status' in body;
}

function resolveMessage(apiError: ApiError): string {
  return apiError.errors?.length ? apiError.errors.join(' ') : apiError.title;
}
