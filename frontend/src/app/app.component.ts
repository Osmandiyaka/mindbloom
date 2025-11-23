import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginOverlayComponent } from './modules/auth/components/login-overlay/login-overlay.component';
import { AuthService } from './core/services/auth.service';
import { TenantService } from './core/services/tenant.service';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { environment } from '../environments/environment';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, LoginOverlayComponent, SidebarComponent],
    template: `
        <div class="app-shell" [class.dimmed]="authService.showLoginOverlay()">
            <app-sidebar />
            <div class="app-content">
                <router-outlet />
            </div>
        </div>
        @if (authService.showLoginOverlay()) {
            <app-login-overlay />
        }
    `,
    styles: [`
        .app-shell {
            display: grid;
            grid-template-columns: 260px 1fr;
            height: 100vh;
            transition: filter 0.3s ease, opacity 0.3s ease;
        }

        .app-shell.dimmed {
            opacity: 0.95;
            pointer-events: none;
        }

        .app-content {
            background: #f7f9fc;
            overflow: auto;
        }
    `]
})
export class AppComponent implements OnInit {
    title = 'MindBloom';

    constructor(
        public authService: AuthService,
        private tenantService: TenantService
    ) { }

    ngOnInit(): void {
        // For development: Set a default tenant if none exists
        if (!environment.production && !this.tenantService.getTenantId()) {
            const devTenant = {
                id: '674189e9f57b370bbc3efae9',
                name: 'Development School',
                subdomain: 'dev',
                status: 'active' as const,
                plan: 'enterprise' as const
            };
            this.tenantService.setTenant(devTenant);
            console.log('Development tenant initialized:', devTenant);
        }
    }
}
