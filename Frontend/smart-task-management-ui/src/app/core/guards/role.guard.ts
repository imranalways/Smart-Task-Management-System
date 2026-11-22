
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { UserRole } from '../constants/user-roles';

export const roleGuard: CanActivateFn = (route, state) => {

  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(
      ['/auth/login'],
      {
        queryParams: {
          returnUrl: state.url
        }
      }
    );
  }

  const allowedRoles =
    route.data['roles'] as UserRole[] | undefined;

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  const currentRole = auth.getRole();

  if (allowedRoles.includes(currentRole as UserRole)) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
