import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'ui-badge',
    standalone: true,
    imports: [CommonModule],
    template: `
    <span [class]="badgeClass">
      <ng-content></ng-content>{{ text }}
    </span>
  `,
    styles: [`
    :host { display: inline-flex; }
    .ui-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
      line-height: 1.2;
      border: 1px solid transparent;
      background: var(--color-surface, #f3f4f6);
      color: var(--color-text-primary);
    }

    .ui-badge--neutral { background: var(--badge-neutral-bg, #f3f4f6); color: var(--color-text-primary); }
    .ui-badge--success { background: color-mix(in srgb, #10b981 12%, #ffffff 88%); color: #0f5132; border-color: #86efac; }
    .ui-badge--info { background: color-mix(in srgb, #3b82f6 12%, #ffffff 88%); color: #1d4ed8; border-color: #bfdbfe; }
    .ui-badge--warning { background: color-mix(in srgb, #f59e0b 18%, #ffffff 82%); color: #92400e; border-color: #fcd34d; }
    .ui-badge--danger { background: color-mix(in srgb, #ef4444 14%, #ffffff 86%); color: #991b1b; border-color: #fca5a5; }
  `]
})
export class UiBadgeComponent {
    @Input() text = '';
    @Input() tone: 'neutral' | 'success' | 'info' | 'warning' | 'danger' = 'neutral';

    get badgeClass(): string {
        return `ui-badge ui-badge--${this.tone}`;
    }
}
