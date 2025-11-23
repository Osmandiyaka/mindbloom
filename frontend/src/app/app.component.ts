import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginOverlayComponent } from './modules/auth/components/login-overlay/login-overlay.component';
import { AuthService } from './core/services/auth.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, LoginOverlayComponent],
    template: `
        @if (authService.showLoginOverlay()) {
            <app-login-overlay />
        }
        <router-outlet />
    `
})
export class AppComponent {
    title = 'MindBloom';

    constructor(public authService: AuthService) { }
}
