import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type EntitlementBadgeStatus = 'included' | 'add_on' | 'locked' | 'overridden';

@Component({
    selector: 'app-entitlement-badge',
    standalone: true,
    imports: [CommonModule],
    template: `
        <span class="entitlement-badge" [class]="'status-' + status">
            {{ label || defaultLabel }}
        </span>
    `,
    styles: [`
        .entitlement-badge {
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid rgba(148, 163, 184, 0.3);
            background: rgba(148, 163, 184, 0.08);
            color: var(--color-text-secondary);
            font-weight: 600;
            letter-spacing: 0.02em;
        }

        .status-included {
            color: #0f766e;
            border-color: rgba(13, 148, 136, 0.3);
            background: rgba(13, 148, 136, 0.12);
        }

        .status-add_on {
            color: #92400e;
            border-color: rgba(245, 158, 11, 0.4);
            background: rgba(245, 158, 11, 0.12);
        }

        .status-locked {
            color: #475569;
            border-color: rgba(100, 116, 139, 0.35);
            background: rgba(148, 163, 184, 0.12);
        }

        .status-overridden {
            color: #b45309;
            border-color: rgba(251, 146, 60, 0.4);
            background: rgba(251, 146, 60, 0.12);
        }
    `],
})
export class EntitlementBadgeComponent {
    @Input() status: EntitlementBadgeStatus = 'locked';
    @Input() label = '';

    get defaultLabel(): string {
        switch (this.status) {
            case 'included':
                return 'Included';
            case 'add_on':
                return 'Add-on';
            case 'overridden':
                return 'Overridden';
            default:
                return 'Locked';
        }
    }
}
