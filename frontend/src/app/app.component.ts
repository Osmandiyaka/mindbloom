import { Component, OnInit, effect, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { LoginOverlayComponent } from './modules/auth/components/login-overlay/login-overlay.component';
import { AuthService } from './core/auth/auth.service';
import { TenantService } from './core/services/tenant.service';
import { ThemeSwitcherComponent } from './shared/components/theme-switcher/theme-switcher.component';
import { environment } from '../environments/environment';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MbThemeDirective, MbThemeService } from '@mindbloom/ui';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, LoginOverlayComponent, CommonModule, ThemeSwitcherComponent, MbThemeDirective],
    template: `
        <div class="app-root" mbTheme [class.dimmed]="authService.status() === 'authenticated' && authRoute">
            <div class="theme-switcher-shell" *ngIf="!authRoute">
                <app-theme-switcher />
            </div>
            <!-- Auth resolving gate: show minimal loading while unresolved -->
            @if (authService.status() === 'unresolved') {
                <div class="auth-loading-gate">
                    <div class="spinner"></div>
                    <p>Loading session...</p>
                </div>
            } @else {
                <router-outlet />
            }
        </div>
        @if (authService.status() === 'anonymous' && authRoute) {
            <app-login-overlay />
        }
    `,
    styles: [`
        .app-root {
            min-height: 100vh;
            background: var(--mb-color-bg);
            transition: filter 0.3s ease, opacity 0.3s ease;
        }
        .app-root.dimmed {
            opacity: 0.95;
            pointer-events: none;
        }
        .auth-loading-gate {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: var(--mb-color-bg);
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid color-mix(in srgb, var(--mb-color-primary) 25%, transparent);
            border-top-color: var(--mb-color-primary);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .auth-loading-gate p {
            margin-top: 1rem;
            color: var(--mb-color-text-muted);
            font-size: 0.875rem;
        }

        .theme-switcher-shell {
            position: fixed;
            top: 14px;
            right: 14px;
            z-index: 20;
        }
    `]
})
export class AppComponent implements OnInit {
    title = 'MindBloom';
    authRoute = false;
    authService = inject(AuthService);
    private tenantService = inject(TenantService);
    private themeService = inject(MbThemeService);
    private router = inject(Router);
    private readonly tenantBrandingEffect = effect(
        () => {
            const tenant = this.tenantService.currentTenant();
            if (!tenant) {
                this.themeService.setTenantBranding(undefined);
                return;
            }
            const primary = tenant.customization?.primaryColor || '#1f6f63';
            const logoUrl = tenant.customization?.logo;
            this.themeService.setTenantBranding({
                tenantId: tenant.id,
                primary,
                logoUrl
            });
        },
        { allowSignalWrites: true }
    );

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
                editionId: 'enterprise',
                edition: 'enterprise' as const,
                contactInfo: { email: 'admin@devschool.local' },
            };
            this.tenantService.setTenant(devTenant);
            console.log('Development tenant initialized:', devTenant);
        }

    }
}
