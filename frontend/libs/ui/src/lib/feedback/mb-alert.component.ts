import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type MbAlertVariant = 'info' | 'success' | 'warning' | 'danger';

@Component({
    selector: 'mb-alert',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="mb-alert" [class.mb-alert--success]="variant === 'success'" [class.mb-alert--warning]="variant === 'warning'" [class.mb-alert--danger]="variant === 'danger'">
            <span class="mb-alert__icon" aria-hidden="true">{{ icon }}</span>
            <div class="mb-alert__content">
                <div class="mb-alert__title" *ngIf="title">{{ title }}</div>
                <div class="mb-alert__message"><ng-content></ng-content></div>
            </div>
        </div>
    `,
    styleUrls: ['./mb-alert.component.scss']
})
export class MbAlertComponent {
    @Input() variant: MbAlertVariant = 'info';
    @Input() title?: string;

    get icon(): string {
        switch (this.variant) {
            case 'success':
                return '✓';
            case 'warning':
                return '!';
            case 'danger':
                return '✕';
            default:
                return 'ℹ';
        }
    }
}
