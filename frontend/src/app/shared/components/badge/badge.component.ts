import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-badge',
    standalone: true,
    imports: [CommonModule],
    template: `
    <span [class]="getBadgeClasses()">
      <ng-content />
    </span>
  `
})
export class BadgeComponent {
    @Input() variant: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' = 'primary';
    @Input() size: 'sm' | 'md' | 'lg' = 'md';
    @Input() outline = false;
    @Input() dot = false;

    getBadgeClasses(): string {
        const classes = ['badge', `badge-${this.variant}`];

        if (this.size !== 'md') {
            classes.push(`badge-${this.size}`);
        }

        if (this.outline) {
            classes.push('badge-outline');
        }

        if (this.dot) {
            classes.push('badge-dot');
        }

        return classes.join(' ');
    }
}
