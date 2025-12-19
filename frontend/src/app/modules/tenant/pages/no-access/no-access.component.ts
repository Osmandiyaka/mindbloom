import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
    selector: 'app-no-access',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './no-access.component.html',
    styleUrls: ['./no-access.component.scss']
})
export class NoAccessComponent {
    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    logout(): void {
        this.authService.logout();
    }

    contactSupport(): void {
        window.location.href = 'mailto:support@eduhub.com?subject=No School Access';
    }
}
