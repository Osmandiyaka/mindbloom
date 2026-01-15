import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiButtonComponent } from '../../../ui/buttons/ui-button.component';
import { EntitlementReasonRendererComponent } from '../entitlement-reason-renderer/entitlement-reason-renderer.component';
import { LockContext, LockCtaType, LockReason } from '../../../types/entitlement-lock';

@Component({
    selector: 'app-gated-landing-panel',
    standalone: true,
    imports: [CommonModule, UiButtonComponent, EntitlementReasonRendererComponent],
    template: `
        <div class="gated-panel">
            <div class="gated-panel__card">
                <div class="gated-panel__header">
                    <p class="gated-panel__title">{{ title }}</p>
                    <p class="gated-panel__subtitle">{{ subtitle }}</p>
                </div>
                <div class="gated-panel__body">
                    <app-entitlement-reason-renderer
                        [reason]="reason"
                        [context]="context"
                        (action)="action.emit($event)">
                    </app-entitlement-reason-renderer>
                    <ul class="gated-panel__list" *ngIf="bullets?.length">
                        <li *ngFor="let bullet of bullets">{{ bullet }}</li>
                    </ul>
                </div>
                <div class="gated-panel__footer">
                    <ui-button variant="ghost" size="sm" (click)="viewPlans.emit()">View plans & entitlements</ui-button>
                    <ui-button variant="ghost" size="sm" (click)="back.emit()">Back</ui-button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .gated-panel {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 60vh;
            padding: 24px;
        }

        .gated-panel__card {
            width: min(560px, 100%);
            border: 1px solid rgba(148, 163, 184, 0.2);
            border-radius: 16px;
            padding: 20px 22px;
            background: white;
            display: grid;
            gap: 16px;
        }

        .gated-panel__title {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        }

        .gated-panel__subtitle {
            margin: 6px 0 0;
            color: var(--color-text-secondary);
            font-size: 13px;
        }

        .gated-panel__body {
            display: grid;
            gap: 12px;
        }

        .gated-panel__list {
            margin: 0;
            padding-left: 18px;
            color: var(--color-text-secondary);
            font-size: 12px;
            display: grid;
            gap: 4px;
        }

        .gated-panel__footer {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
        }
    `],
})
export class GatedLandingPanelComponent {
    @Input() title = 'This module is not available';
    @Input() subtitle = 'Your plan does not include this module.';
    @Input() bullets: string[] = [];
    @Input() reason: LockReason = 'NOT_IN_PLAN';
    @Input() context: LockContext = {};
    @Output() action = new EventEmitter<LockCtaType>();
    @Output() viewPlans = new EventEmitter<void>();
    @Output() back = new EventEmitter<void>();
}
