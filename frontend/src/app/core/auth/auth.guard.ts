import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Allow public routes
    if (route.data?.['public'] === true) {
        return true;
    }

    // Wait for auth status to resolve (not 'unresolved')
    let status = authService.status();
    let maxWait = 50; // 5 seconds with 100ms checks
    while (status === 'unresolved' && maxWait > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        status = authService.status();
        maxWait--;
    }

    // After resolution, check authentication
    if (authService.isAuthenticated()) {
        return true;
    }

    // Not authenticated; redirect to login with returnUrl
    const queryParams: Record<string, string> = {
        returnUrl: state.url,
    };

    return router.createUrlTree(['/login'], { queryParams });
};
