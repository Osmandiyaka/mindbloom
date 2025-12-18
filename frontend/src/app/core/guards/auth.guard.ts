import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (route.data?.['public'] === true) {
        return true;
    }

    return authService.ensureAuthenticated().pipe(
        map(isAuthed => {
            if (isAuthed) {
                return true;
            }

            const queryParams: Record<string, string> = { returnUrl: state.url };
            const sessionExpired = (authService as any).hasAttemptedRefresh === true;
            if (sessionExpired) {
                queryParams['sessionExpired'] = 'true';
            }

            return router.createUrlTree(['/login'], { queryParams });
        }),
    );
};
