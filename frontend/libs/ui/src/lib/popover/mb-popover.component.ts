import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';

@Component({
    selector: 'mb-popover',
    standalone: true,
    imports: [CommonModule, OverlayModule],
    template: `
        <ng-template
            cdkConnectedOverlay
            [cdkConnectedOverlayOrigin]="origin"
            [cdkConnectedOverlayOpen]="open"
            [cdkConnectedOverlayPositions]="positions"
            [cdkConnectedOverlayHasBackdrop]="hasBackdrop"
            [cdkConnectedOverlayBackdropClass]="'mb-popover-backdrop'"
            (backdropClick)="close()"
        >
            <div class="mb-popover" role="dialog">
                <ng-content></ng-content>
            </div>
        </ng-template>
    `,
    styleUrls: ['./mb-popover.component.scss']
})
export class MbPopoverComponent {
    @Input() open = false;
    @Input({ required: true }) origin!: CdkOverlayOrigin;
    @Input() hasBackdrop = false;
    @Output() closed = new EventEmitter<void>();

    positions: ConnectedPosition[] = [
        {
            originX: 'center',
            originY: 'bottom',
            overlayX: 'center',
            overlayY: 'top',
            offsetY: 8
        },
        {
            originX: 'center',
            originY: 'top',
            overlayX: 'center',
            overlayY: 'bottom',
            offsetY: -8
        }
    ];

    close(): void {
        this.closed.emit();
    }
}
