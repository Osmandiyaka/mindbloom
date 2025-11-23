import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginOverlayComponent } from './modules/auth/components/login-overlay/login-overlay.component';
import { AuthService } from './core/services/auth.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, LoginOverlayComponent],
    template: `
        <div class="app-shell" [class.dimmed]="authService.showLoginOverlay()">
            <router-outlet />
        </div>
        @if (authService.showLoginOverlay()) {
            <app-login-overlay />
        }
    `,
    styles: [`
        .app-shell {
            display: flex;
            height: 100vh;
            width: 100vw;
            transition: filter 0.3s ease, opacity 0.3s ease;
        }

        .app-shell.dimmed {
            filter: blur(3px);
            opacity: 0.5;
            pointer-events: none;
        }
    `]
})
export class AppComponent {
    title = 'MindBloom';

    constructor(public authService: AuthService) { }
}
