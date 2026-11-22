
import { Routes } from '@angular/router';

export const PROJECT_ROUTES: Routes = [

  {
    path: '',
    loadComponent: () =>
      import('./project-list/project-list.component')
        .then(m => m.ProjectListComponent)
  },

  {
    path: 'create',
    loadComponent: () =>
      import('./project-create/project-create.component')
        .then(m => m.ProjectCreateComponent)
  },

  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./project-edit/project-edit.component')
        .then(m => m.ProjectEditComponent)
  },
  {
  path: 'details/:id',
  loadComponent: () =>
    import('./project-details/project-details.component')
      .then(m => m.ProjectDetailsComponent)
}

];
