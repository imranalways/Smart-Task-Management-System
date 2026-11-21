import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  {
    path: 'auth',

    loadChildren: () =>
      import('./features/auth/auth.routes')
      .then(m => m.AUTH_ROUTES)
  },

  {
    path: '',

    canActivate: [authGuard],

    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component')
      .then(m => m.MainLayoutComponent),

    children: [

      {
        path: '',

        redirectTo: 'dashboard',

        pathMatch: 'full'
      }
    ]
  },

  {
    path: '**',

    redirectTo: 'auth/login'
  },
  {
  path: 'dashboard',

  loadChildren: () =>
    import(
      './features/dashboard/dashboard.routes'
    )
    .then(
      m =>
      m.DASHBOARD_ROUTES)
}
];