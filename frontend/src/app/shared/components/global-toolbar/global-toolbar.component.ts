import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-global-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './global-toolbar.component.html',
  styleUrl: './global-toolbar.component.scss'
})
export class GlobalToolbarComponent {
  searchQuery: string = '';

  onSearch() {
    console.log('Search:', this.searchQuery);
  }

  onBackClick() {
    window.history.back();
  }

  onHomeClick() {
    // Navigate to home
  }

  onUsersClick() {
    // Navigate to users
  }

  onListClick() {
    // Show list view
  }

  onMenuClick() {
    // Show menu
  }

  onCardClick() {
    // Show card view
  }

  onChartClick() {
    // Show charts
  }

  onCalendarClick() {
    // Show calendar
  }

  onPeopleClick() {
    // Show people
  }

  onArchiveClick() {
    // Show archive
  }
}
