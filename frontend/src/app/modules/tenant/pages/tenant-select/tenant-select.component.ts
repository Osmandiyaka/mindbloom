import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { TenantContextService } from '../../../../core/tenant/tenant-context.service';
import { TenantBootstrapService } from '../../../../core/tenant/tenant-bootstrap.service';
import { TenantMembership } from '../../../../core/auth/auth.models';

@Component({
    selector: 'app-tenant-select',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './tenant-select.component.html',
    styleUrls: ['./tenant-select.component.scss']
})
export class TenantSelectComponent implements OnInit {
    readonly searchQuery = signal<string>('');
    readonly memberships = signal<TenantMembership[]>([]);
    readonly selectedTenant = signal<TenantMembership | null>(null);
    readonly isLoading = signal<boolean>(false);
    readonly errorMessage = signal<string>('');

    private returnUrl: string = '/dashboard';

    // Filtered memberships based on search
    readonly filteredMemberships = computed(() => {
        const query = this.searchQuery().toLowerCase();
        const all = this.memberships();

        if (!query) {
            return all;
        }

        return all.filter(m =>
            m.tenantName.toLowerCase().includes(query) ||
            m.tenantSlug.toLowerCase().includes(query)
        );
    });

    readonly hasNoAccess = computed(() => this.memberships().length === 0);

    constructor(
        private authService: AuthService,
        private tenantContext: TenantContextService,
        private tenantBootstrap: TenantBootstrapService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        // Get return URL from query params
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

        // Sanitize returnUrl (must be relative and safe)
        if (!this.returnUrl.startsWith('/') ||
            this.returnUrl === '/select-school' ||
            this.returnUrl.startsWith('/login') ||
            this.returnUrl.startsWith('/apply')) {
            this.returnUrl = '/dashboard';
        }

        // Load memberships from auth session
        const session = this.authService.session();

        if (!session) {
            // Not authenticated, redirect to login
            this.router.navigate(['/login']);
            return;
        }

        const memberships = session.memberships || [];
        this.memberships.set(memberships);

        if (memberships.length === 0) {
            this.errorMessage.set('No schools assigned to your account.');
            return;
        }

        // Try to restore last-used tenant
        const restored = this.tenantContext.restoreFromMemberships(memberships);

        if (restored) {
            const activeTenant = this.tenantContext.activeTenant();
            this.selectedTenant.set(activeTenant);
        } else {
            // Default to first tenant
            this.selectedTenant.set(memberships[0]);
        }
    }

    selectTenant(tenant: TenantMembership): void {
        this.selectedTenant.set(tenant);
    }

    continue(): void {
        const tenant = this.selectedTenant();

        if (!tenant) {
            this.errorMessage.set('Please select a school to continue.');
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        // Use bootstrap service to switch tenant cleanly
        this.tenantBootstrap.switchTenant(tenant).subscribe({
            next: (success) => {
                if (success) {
                    // Navigate to return URL
                    this.router.navigateByUrl(this.returnUrl);
                } else {
                    this.errorMessage.set('Failed to initialize school context. Please try again.');
                    this.isLoading.set(false);
                }
            },
            error: (error) => {
                console.error('Tenant selection error:', error);
                this.errorMessage.set('An error occurred. Please try again.');
                this.isLoading.set(false);
            }
        });
    }

    contactSupport(): void {
        // Navigate to support or show contact info
        window.location.href = 'mailto:support@eduhub.com?subject=No Schools Assigned';
    }
}
