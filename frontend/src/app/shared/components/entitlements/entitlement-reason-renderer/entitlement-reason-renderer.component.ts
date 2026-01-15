import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiButtonComponent } from '../../../ui/buttons/ui-button.component';
import { LockContext, LockCtaType, LockReason, getLockMessage } from '../../../types/entitlement-lock';

@Component({
    selector: 'app-entitlement-reason-renderer',
    standalone: true,
    imports: [CommonModule, UiButtonComponent],
    template: `
        <div class="reason-renderer" [class.is-compact]="compact">
            <p class="reason-title">{{ message.title }}</p>
            <p class="reason-body">{{ message.body }}</p>
            <div class="reason-actions" *ngIf="message.ctaType !== 'none'">
                <ui-button
                    size="sm"
                    variant="primary"
                    (click)="trigger(message.ctaType)">
                    {{ message.ctaLabel }}
                </ui-button>
                <ui-button
                    *ngIf="message.secondaryLabel"
                    size="sm"
                    variant="ghost"
                    (click)="trigger(message.secondaryType!)">
                    {{ message.secondaryLabel }}
                </ui-button>
            </div>
        </div>
    `,
    styles: [`
        .reason-renderer {
            display: grid;
            gap: 8px;
        }

        .reason-title {
            margin: 0;
            font-weight: 600;
            font-size: 13px;
        }

        .reason-body {
            margin: 0;
            color: var(--color-text-secondary);
            font-size: 12px;
            line-height: 1.4;
        }

        .reason-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .reason-renderer.is-compact {
            gap: 6px;
        }

        .reason-renderer.is-compact .reason-title {
            font-size: 12px;
        }
    `],
})
export class EntitlementReasonRendererComponent {
    @Input() reason: LockReason = 'NOT_IN_PLAN';
    @Input() context: LockContext = {};
    @Input() compact = false;
    @Output() action = new EventEmitter<LockCtaType>();

    get message() {
        return getLockMessage(this.reason, this.context);
    }

    trigger(action: LockCtaType) {
        this.action.emit(action);
    }
}
