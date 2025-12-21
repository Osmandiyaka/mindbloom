import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { LoginOverlayComponent } from './modules/auth/components/login-overlay/login-overlay.component';
import { AuthService } from './core/auth/auth.service';
import { TenantService } from './core/services/tenant.service';
import { ThemeService } from './core/services/theme.service';
import { ThemeSwitcherComponent } from './shared/components/theme-switcher/theme-switcher.component';
import { environment } from '../environments/environment';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, LoginOverlayComponent, CommonModule, ThemeSwitcherComponent],
    template: `
        <div class="app-root" [class.dimmed]="authService.status() === 'authenticated' && authRoute">
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
            background: var(--content-background, var(--color-background, #f7f9fc));
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
            background: var(--surface-app, #ffffff);
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--color-primary-200, #e0e7ff);
            border-top-color: var(--color-primary-500, #6366f1);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .auth-loading-gate p {
            margin-top: 1rem;
            color: var(--color-text-secondary, #666);
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
    private themeService = inject(ThemeService);
    private router = inject(Router);

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
