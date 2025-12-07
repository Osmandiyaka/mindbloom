import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { LoginOverlayComponent } from './modules/auth/components/login-overlay/login-overlay.component';
import { AuthService } from './core/services/auth.service';
import { TenantService } from './core/services/tenant.service';
import { ThemeService } from './core/services/theme.service';
import { environment } from '../environments/environment';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, LoginOverlayComponent],
    template: `
        <div class="app-root" [class.dimmed]="authService.showLoginOverlay()">
            <router-outlet />
        </div>
        @if (authService.showLoginOverlay()) {
            <app-login-overlay />
        }
    `,
    styles: [`
        .app-root {
            min-height: 100vh;
            background: var(--content-background, var(--color-background, #f7f9fc));
            transition: filter 0.3s ease, opacity 0.3s ease;
        }
        .app-root.dimmed {
            opacity: 0.95;
            pointer-events: none;
        }
    `]
})
export class AppComponent implements OnInit {
    title = 'MindBloom';

    constructor(
        public authService: AuthService,
        private tenantService: TenantService,
        private themeService: ThemeService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.initializeTenant();
    }

    private initializeTenant(): void {
        const subdomain = this.tenantService.extractSubdomainFromUrl();
        
        // If no subdomain (base domain), show host landing page
        if (!subdomain) {
            console.warn('No tenant subdomain detected - showing host landing page');
            this.router.navigate(['/host']);
            return;
        }

        // Check if tenant already loaded in storage
        const storedTenant = this.tenantService.getTenantFromStorage();
        if (storedTenant && storedTenant.subdomain === subdomain) {
            console.log('Using cached tenant:', storedTenant.name);
            return;
        }

        // Fetch tenant from backend by subdomain
        this.tenantService.getTenantBySubdomain(subdomain).subscribe({
            next: (tenant) => {
                this.tenantService.setTenant(tenant);
                console.log('Tenant loaded:', tenant.name);
            },
            error: (err) => {
                console.error('Failed to load tenant:', err);
                
                // Development fallback
                if (!environment.production) {
                    console.warn('Using development tenant fallback');
                    const devTenant = {
                        id: '674189e9f57b370bbc3efae9',
                        name: 'Development School',
                        subdomain: subdomain,
                        status: 'active' as const,
                        plan: 'enterprise' as const,
                        contactInfo: { email: 'admin@devschool.local' },
                    };
                    this.tenantService.setTenant(devTenant);
                }
            }
        });
    }
}
