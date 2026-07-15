import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from './auth.service';

// Novas abas/reloads começam sem o accessToken em memória (por design, ele não é
// persistido). Antes de redirecionar pro login, tenta restaurar a sessão via
// refresh token (cookie httpOnly) para não deslogar o usuário nesses casos.
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return authService.refresh().pipe(
    map(() => true),
    catchError(() => of(router.parseUrl('/login'))),
  );
};
