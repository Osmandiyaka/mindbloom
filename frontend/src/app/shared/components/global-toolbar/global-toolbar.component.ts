import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-global-toolbar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './global-toolbar.component.html',
    styleUrl: './global-toolbar.component.scss'
})
export class GlobalToolbarComponent {
    searchQuery: string = '';

    constructor(private authService: AuthService) { }

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
