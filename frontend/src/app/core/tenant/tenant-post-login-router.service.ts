/**
 * TenantPostLoginRouter - Handles post-login tenant selection logic
 * Routes users based on their tenant memberships
 */

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TenantContextService } from './tenant-context.service';
import { TenantBootstrapService } from './tenant-bootstrap.service';
import { TenantMembership } from '../auth/auth.models';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class TenantPostLoginRouter {
    private readonly tenantContext = inject(TenantContextService);
    private readonly tenantBootstrap = inject(TenantBootstrapService);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);

    /**
     * Route user after successful login based on their memberships
     */
    async route(memberships: TenantMembership[], returnUrl?: string): Promise<void> {
        // Sanitize returnUrl
        const safeReturnUrl = this.sanitizeReturnUrl(returnUrl);

        console.log('[TenantPostLoginRouter] Routing with', memberships.length, 'memberships');

        // Host sessions should bypass tenant selection entirely
        if (memberships.length === 0) {
            const session = this.authService.session();
            if (session?.mode === 'host') {
                await this.router.navigate(['/host']);
                return;
            }
        }

        // No memberships - just continue to the app (no no-access detour)
        if (memberships.length === 0) {
            await this.router.navigateByUrl(safeReturnUrl);
            return;
        }

        // Single tenant - auto-select
        if (memberships.length === 1) {
            const tenant = memberships[0];
            console.log('[TenantPostLoginRouter] Auto-selecting single tenant:', tenant.tenantName);

            const success = await firstValueFrom(this.tenantBootstrap.switchTenant(tenant));

            if (success) {
                await this.router.navigateByUrl(safeReturnUrl);
            } else {
                // Bootstrap failed, send user to their target without blocking
                await this.router.navigateByUrl(safeReturnUrl);
            }
            return;
        }

        // Multiple tenants - check if we can restore last-used tenant
        const restored = this.tenantContext.restoreFromMemberships(memberships);

        if (restored) {
            const tenant = this.tenantContext.activeTenant();
            console.log('[TenantPostLoginRouter] Restored last tenant:', tenant?.tenantName);

            // Reload context for restored tenant
            const success = await firstValueFrom(this.tenantBootstrap.switchTenant(tenant!));

            if (success) {
                await this.router.navigateByUrl(safeReturnUrl);
                return;
            }
        }

        // Multiple tenants, no valid restoration - auto-pick first working tenant
        console.log('[TenantPostLoginRouter] Auto-selecting first available tenant');
        for (const tenant of memberships) {
            const success = await firstValueFrom(this.tenantBootstrap.switchTenant(tenant));
            if (success) {
                await this.router.navigateByUrl(safeReturnUrl);
                return;
            }
        }

        // If none worked, still honor the target route instead of blocking
        await this.router.navigateByUrl(safeReturnUrl);
    }

    /**
     * Sanitize return URL to prevent open redirects and loops
     */
    private sanitizeReturnUrl(url?: string): string {
        // Default to dashboard
        if (!url) {
            return '/dashboard';
        }

        // Must be relative path
        if (!url.startsWith('/')) {
            return '/dashboard';
        }

        // Reject loops and public routes
        const disallowedPaths = [
            '/no-access',
            '/login',
            '/register',
            '/apply',
            '/forgot-password',
            '/reset-password'
        ];

        if (disallowedPaths.some(path => url.startsWith(path))) {
            return '/dashboard';
        }

        return url;
    }
}
