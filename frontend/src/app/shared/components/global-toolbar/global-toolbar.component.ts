import { Component, computed, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';
import { ThemeSelectorComponent } from '../theme-selector/theme-selector.component';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { IconRegistryService } from '../../services/icon-registry.service';

@Component({
    selector: 'app-global-toolbar',
    standalone: true,
    imports: [CommonModule, FormsModule, ThemeSelectorComponent, TooltipDirective],
    templateUrl: './global-toolbar.component.html',
    styleUrl: './global-toolbar.component.scss'
})
export class GlobalToolbarComponent {
    @Input() collapsed = false;
    @Output() sidebarToggle = new EventEmitter<void>();
    searchQuery: string = '';
    tenantName = computed(() => this.tenantService.currentTenant()?.name || 'School');

    constructor(
        private authService: AuthService,
        private tenantService: TenantService,
        private router: Router,
        private icons: IconRegistryService
    ) { }

    icon(name: string) {
        return this.icons.icon(name);
    }

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

    onToggleSidebar() {
        this.sidebarToggle.emit();
    }
}
