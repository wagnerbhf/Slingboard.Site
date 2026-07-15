import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'boards' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register-page').then((m) => m.RegisterPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/authenticated-layout').then((m) => m.AuthenticatedLayout),
    children: [
      {
        path: 'boards',
        loadComponent: () =>
          import('./features/boards/dashboard/boards-dashboard-page').then(
            (m) => m.BoardsDashboardPage,
          ),
      },
      {
        path: 'boards/:boardId',
        loadComponent: () =>
          import('./features/boards/board-detail/board-detail-page').then((m) => m.BoardDetailPage),
      },
      {
        path: 'boards/:boardId/settings',
        loadComponent: () =>
          import('./features/boards/board-settings/board-settings-page').then(
            (m) => m.BoardSettingsPage,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'boards' },
];
