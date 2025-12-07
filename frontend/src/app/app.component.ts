import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { LoginOverlayComponent } from './modules/auth/components/login-overlay/login-overlay.component';
import { AuthService } from './core/services/auth.service';
import { TenantService } from './core/services/tenant.service';
import { ThemeService } from './core/services/theme.service';
import { environment } from '../environments/environment';
import { filter } from 'rxjs';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, LoginOverlayComponent],
    template: `
        <div class="app-root" [class.dimmed]="authService.showLoginOverlay() && !authRoute">
            <router-outlet />
        </div>
        @if (authService.showLoginOverlay() && !authRoute) {
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
    authRoute = false;

    constructor(
        public authService: AuthService,
        private tenantService: TenantService,
        private themeService: ThemeService, // Initialize theme service
        private router: Router
    ) { }

    ngOnInit(): void {
        this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
            this.authRoute = e.urlAfterRedirects?.startsWith('/auth');
        });
        // For development: Set a default tenant if none exists
        if (!environment.production && !this.tenantService.getTenantId()) {
            const devTenant = {
                id: '674189e9f57b370bbc3efae9',
                name: 'Development School',
                subdomain: 'dev',
                status: 'active' as const,
                plan: 'enterprise' as const,
                contactInfo: { email: 'admin@devschool.local' },
            };
            this.tenantService.setTenant(devTenant);
            console.log('Development tenant initialized:', devTenant);
        }
    }
}
