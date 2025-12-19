/**
 * Tenant Not Found component.
 * 
 * Enterprise UX for missing or inaccessible tenant.
 * Provides clear guidance and recovery actions.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-tenant-not-found',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './tenant-not-found.component.html',
    styleUrls: ['./tenant-not-found.component.scss']
})
export class TenantNotFoundComponent {
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    // Determine if this is a network error or missing tenant
    readonly isNetworkError = (): boolean => {
        return this.route.snapshot.queryParams['reason'] === 'error';
    };

    readonly title = (): string => {
        return this.isNetworkError() ? 'Connection Issue' : 'School Portal Not Found';
    };

    readonly description = (): string => {
        if (this.isNetworkError()) {
            return 'We couldn\'t load the school portal right now. Please check your connection and try again.';
        }
        return 'The school portal you\'re looking for doesn\'t exist or you don\'t have access to it. Please check the link or contact your school administrator.';
    };

    /**
     * Navigate back to login.
     */
    navigateToLogin(): void {
        this.router.navigate(['/login']);
    }

    /**
     * Retry loading current URL (useful for transient errors).
     */
    retryLoading(): void {
        window.location.reload();
    }
}
