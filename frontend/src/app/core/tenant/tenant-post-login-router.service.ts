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

        // No memberships - route to no access page
        if (memberships.length === 0) {
            await this.router.navigate(['/no-access']);
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
                // Bootstrap failed, redirect to selection screen
                await this.router.navigate(['/select-school'], {
                    queryParams: { returnUrl: safeReturnUrl }
                });
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

        // Multiple tenants, no valid restoration - show selection screen
        console.log('[TenantPostLoginRouter] Routing to tenant selection');
        await this.router.navigate(['/select-school'], {
            queryParams: { returnUrl: safeReturnUrl }
        });
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
            '/select-school',
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
