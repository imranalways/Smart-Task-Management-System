
import { Routes } from '@angular/router';

export const TASK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./task-list/task-list.component')
        .then(m => m.TaskListComponent)
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./task-create/task-create.component')
        .then(m => m.TaskCreateComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./task-edit/task-edit.component')
        .then(m => m.TaskEditComponent)
  },
  {
    path: 'details/:id',
    loadComponent: () =>
      import('./task-details/task-details.component')
        .then(m => m.TaskDetailsComponent)
  }
];
