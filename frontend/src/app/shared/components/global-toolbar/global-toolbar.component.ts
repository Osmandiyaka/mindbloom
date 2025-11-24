import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';
import { ThemeSelectorComponent } from '../theme-selector/theme-selector.component';

@Component({
    selector: 'app-global-toolbar',
    standalone: true,
    imports: [CommonModule, FormsModule, ThemeSelectorComponent],
    templateUrl: './global-toolbar.component.html',
    styleUrl: './global-toolbar.component.scss'
})
export class GlobalToolbarComponent {
    searchQuery: string = '';
    tenantName = computed(() => this.tenantService.currentTenant()?.name || 'School');

    constructor(
        private authService: AuthService,
        private tenantService: TenantService,
        private router: Router
    ) { }

    onSearch() {
        console.log('Search:', this.searchQuery);
        // Implement global search functionality
    }

    onDashboardClick() {
        // Navigate to dashboard
    }

    onStudentsClick() {
        // Navigate to students
    }

    onCalendarClick() {
        // Navigate to calendar
    }

    onReportsClick() {
        // Navigate to reports
    }

    onMarketplaceClick() {
        this.router.navigate(['/setup/marketplace']);
    }

    onNotificationsClick() {
        // Show notifications
    }

    onMessagesClick() {
        // Navigate to messages
    }

    onLogout() {
        this.authService.logout();
    }
}
