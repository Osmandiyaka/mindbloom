import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ConnectedPosition, Overlay, OverlayModule, ScrollStrategy } from '@angular/cdk/overlay';
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
            [cdkConnectedOverlayPanelClass]="panelClass"
            [cdkConnectedOverlayScrollStrategy]="effectiveScrollStrategy"
            (backdropClick)="close()"
        >
            <div class="mb-popover" [class.mb-popover--plain]="variant === 'plain'" role="dialog">
                <ng-content></ng-content>
            </div>
        </ng-template>
    `,
    styleUrls: ['./mb-popover.component.scss']
})
export class MbPopoverComponent {
    private readonly overlay = inject(Overlay);

    @Input() open = false;
    @Input({ required: true }) origin!: CdkOverlayOrigin;
    @Input() hasBackdrop = false;
    @Input() variant: 'default' | 'plain' = 'default';
    @Input() panelClass: string | string[] = 'mb-popover-panel';
    @Input() scrollStrategy?: ScrollStrategy;
    @Output() closed = new EventEmitter<void>();

    positions: ConnectedPosition[] = [
        {
            originX: 'start',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top',
            offsetY: 8
        },
        {
            originX: 'start',
            originY: 'top',
            overlayX: 'start',
            overlayY: 'bottom',
            offsetY: -8
        }
    ];

    get effectiveScrollStrategy(): ScrollStrategy {
        return this.scrollStrategy ?? this.overlay.scrollStrategies.reposition();
    }

    close(): void {
        this.closed.emit();
    }
}
