import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginOverlayComponent } from './modules/auth/components/login-overlay/login-overlay.component';
import { AuthService } from './core/services/auth.service';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

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
            filter: blur(4px);
            opacity: 0.45;
            pointer-events: none;
        }

        .app-content {
            background: #f7f9fc;
            overflow: auto;
        }
    `]
})
export class AppComponent {
    title = 'MindBloom';

    constructor(public authService: AuthService) { }
}
