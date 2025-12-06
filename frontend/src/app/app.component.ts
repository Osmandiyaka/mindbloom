import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginOverlayComponent } from './modules/auth/components/login-overlay/login-overlay.component';
import { AuthService } from './core/services/auth.service';
import { TenantService } from './core/services/tenant.service';
import { ThemeService } from './core/services/theme.service';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { GlobalToolbarComponent } from './shared/components/global-toolbar/global-toolbar.component';
import { environment } from '../environments/environment';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, LoginOverlayComponent, SidebarComponent, GlobalToolbarComponent],
    template: `
        <div
            class="app-shell"
            [class.dimmed]="authService.showLoginOverlay()"
            [class.collapsed]="sidebarCollapsed"
            [style.--sidebar-width]="sidebarCollapsed ? '78px' : '260px'"
            [style.--toolbar-offset]="sidebarCollapsed ? '78px' : '260px'"
        >
            <app-sidebar [collapsed]="sidebarCollapsed" />
            <div class="app-frame">
                <app-global-toolbar
                    [collapsed]="sidebarCollapsed"
                    (sidebarToggle)="toggleSidebar()"
                />
                <main class="app-content">
                    <router-outlet />
                </main>
            </div>
        </div>
        @if (authService.showLoginOverlay()) {
            <app-login-overlay />
        }
    `,
    styles: [`
        .app-shell {
            display: grid;
            grid-template-columns: var(--sidebar-width, 260px) 1fr;
            height: 100vh;
            transition: filter 0.3s ease, opacity 0.3s ease, grid-template-columns 0.25s ease;
            background: var(--content-background, var(--color-background, #f7f9fc));
        }

        .app-shell.collapsed {
            --sidebar-width: 78px;
            --toolbar-offset: 78px;
        }

        .app-shell.dimmed {
            opacity: 0.95;
            pointer-events: none;
        }

        .app-frame {
            position: relative;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }

        .app-content {
            background: var(--content-background, var(--color-background, #f7f9fc));
            overflow: auto;
            transition: background 0.4s ease;
            padding: 1.5rem;
            padding-top: calc(56px + 1.5rem);
            height: 100%;
            box-sizing: border-box;
        }

        @media (max-width: 768px) {
            .app-shell {
                grid-template-columns: var(--sidebar-width, 72px) 1fr;
            }
            .app-content {
                padding: 1rem;
                padding-top: calc(56px + 1rem);
            }
        }
    `]
})
export class AppComponent implements OnInit {
    title = 'MindBloom';
    sidebarCollapsed = false;

    constructor(
        public authService: AuthService,
        private tenantService: TenantService,
        private themeService: ThemeService // Initialize theme service
    ) { }

    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }

    ngOnInit(): void {
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
