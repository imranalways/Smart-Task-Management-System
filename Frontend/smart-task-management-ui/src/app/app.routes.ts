
import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

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
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes')
            .then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'projects',
        loadChildren: () =>
          import('./features/projects/project.routes')
            .then(m => m.PROJECT_ROUTES)
      },
      {
        path: 'tasks',
        loadChildren: () =>
          import('./features/tasks/task.routes')
            .then(m => m.TASK_ROUTES)
      },
      {
        path: 'team',
        loadComponent: () =>
            import('./features/team-members/team-members.component')
            .then(m => m.TeamMembersComponent),
            canActivate: [roleGuard],
            data: { roles: ['Admin','ProjectManager'] }
        },
        {
        path: 'user-roles',
        loadComponent: () =>
            import('./features/user-roles/user-roles.component')
            .then(m => m.UserRolesComponent),
            canActivate: [roleGuard],
            data: { roles: ['Admin'] }
        }
    ]
  },

  {
    path: '**',
    redirectTo: 'auth/login'
  }

];
