import { CommonModule } from '@angular/common';
import { Component, ContentChild, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { MbModalFooterDirective } from './mb-modal-footer.directive';

type MbModalSize = 'sm' | 'md' | 'lg';

@Component({
    selector: 'mb-modal',
    standalone: true,
    imports: [CommonModule, A11yModule, MbModalFooterDirective],
    template: `
        <div class="mb-modal-backdrop" *ngIf="open" (click)="onBackdropClick($event)">
            <div
                class="mb-modal"
                [class.mb-modal--sm]="size === 'sm'"
                [class.mb-modal--lg]="size === 'lg'"
                role="dialog"
                aria-modal="true"
                [attr.aria-labelledby]="title ? titleId : null"
                cdkTrapFocus
                (click)="$event.stopPropagation()"
            >
                <header class="mb-modal__header" *ngIf="title || closeable">
                    <h2 class="mb-modal__title" *ngIf="title" [id]="titleId">{{ title }}</h2>
                    <button
                        *ngIf="closeable"
                        type="button"
                        class="mb-modal__close"
                        (click)="close()"
                        aria-label="Close dialog"
                    >
                        &times;
                    </button>
                </header>
                <div class="mb-modal__body">
                    <ng-content></ng-content>
                </div>
                <footer class="mb-modal__footer" *ngIf="hasFooter || footerSlot">
                    <ng-content select="[mbModalFooter]"></ng-content>
                </footer>
            </div>
        </div>
    `,
    styleUrls: ['./mb-modal.component.scss']
})
export class MbModalComponent {
    @Input() open = false;
    @Input() title?: string;
    @Input() size: MbModalSize = 'md';
    @Input() closeable = true;
    @Input() closeOnBackdrop = true;
    @Input() hasFooter = false;
    @Output() closed = new EventEmitter<void>();

    titleId = `mb-modal-title-${Math.random().toString(36).slice(2, 9)}`;
    @ContentChild(MbModalFooterDirective) footerSlot?: MbModalFooterDirective;

    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.open && this.closeable) {
            this.close();
        }
    }

    onBackdropClick(event: MouseEvent): void {
        if (this.closeOnBackdrop && event.target === event.currentTarget) {
            this.close();
        }
    }

    close(): void {
        this.closed.emit();
    }
}
