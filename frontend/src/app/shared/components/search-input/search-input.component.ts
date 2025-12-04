import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./search-input.component.scss'],
  template: `
    <label class="search-field">
      <span class="icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="6"></circle>
          <line x1="16.5" y1="16.5" x2="21" y2="21"></line>
        </svg>
      </span>
      <input type="search" [placeholder]="placeholder" (input)="emit($event)" />
    </label>
  `
})
export class SearchInputComponent {
  @Input() placeholder = 'Search...';
  @Output() search = new EventEmitter<string>();
  private debounceTimer?: any;

  emit(event: Event) {
    const term = (event.target as HTMLInputElement).value;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.search.emit(term), 200);
  }
}
