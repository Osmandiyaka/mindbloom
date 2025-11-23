import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StatCard {
    icon: string;
    label: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative';
    iconColor?: 'blue' | 'success' | 'warning' | 'error';
}

@Component({
    selector: 'app-stats-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="stats-card">
      <div class="stats-icon" [class]="'stats-icon-' + (iconColor || 'blue')">
        {{ icon }}
      </div>
      <div class="stats-content">
        <div class="stats-label">{{ label }}</div>
        <div class="stats-value">{{ value }}</div>
        <div class="stats-change" *ngIf="change" [class]="changeType">
          {{ change }}
        </div>
      </div>
    </div>
  `
})
export class StatsCardComponent {
    @Input({ required: true }) icon!: string;
    @Input({ required: true }) label!: string;
    @Input({ required: true }) value!: string | number;
    @Input() change?: string;
    @Input() changeType?: 'positive' | 'negative';
    @Input() iconColor?: 'blue' | 'success' | 'warning' | 'error';
}
