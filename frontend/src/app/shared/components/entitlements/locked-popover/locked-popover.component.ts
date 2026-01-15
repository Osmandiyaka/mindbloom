import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EntitlementReasonRendererComponent } from '../entitlement-reason-renderer/entitlement-reason-renderer.component';
import { LockContext, LockCtaType, LockReason } from '../../../types/entitlement-lock';

@Component({
    selector: 'app-locked-popover',
    standalone: true,
    imports: [CommonModule, EntitlementReasonRendererComponent],
    template: `
        <div class="locked-popover" *ngIf="open" role="tooltip">
            <app-entitlement-reason-renderer
                [reason]="reason"
                [context]="context"
                [compact]="true"
                (action)="action.emit($event)">
            </app-entitlement-reason-renderer>
        </div>
    `,
    styles: [`
        .locked-popover {
            position: absolute;
            z-index: 20;
            min-width: 220px;
            padding: 10px 12px;
            border-radius: 10px;
            border: 1px solid rgba(148, 163, 184, 0.25);
            background: white;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
        }
    `],
})
export class LockedPopoverComponent {
    @Input() open = false;
    @Input() reason: LockReason = 'NOT_IN_PLAN';
    @Input() context: LockContext = {};
    @Output() action = new EventEmitter<LockCtaType>();
}
