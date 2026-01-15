import { CommonModule } from '@angular/common';
import { Component, ContentChild, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { MbDrawerFooterDirective } from './mb-drawer-footer.directive';

type MbDrawerPosition = 'right' | 'left';

@Component({
    selector: 'mb-drawer',
    standalone: true,
    imports: [CommonModule, A11yModule, MbDrawerFooterDirective],
    template: `
        <div
            class="mb-drawer-backdrop"
            *ngIf="open"
            [ngClass]="backdropClass"
            (click)="onBackdropClick($event)"
        >
            <aside
                class="mb-drawer"
                [ngClass]="panelClass"
                [class.mb-drawer--left]="position === 'left'"
                role="dialog"
                aria-modal="true"
                cdkTrapFocus
                (click)="$event.stopPropagation()"
            >
                <header class="mb-drawer__header">
                    <h2 class="mb-drawer__title" *ngIf="title">{{ title }}</h2>
                    <button
                        type="button"
                        class="mb-drawer__close"
                        (click)="close()"
                        aria-label="Close drawer"
                    >
                        &times;
                    </button>
                </header>
                <div class="mb-drawer__body">
                    <ng-content></ng-content>
                </div>
                <footer class="mb-drawer__footer" *ngIf="hasFooter || footerSlot">
                    <ng-content select="[mbDrawerFooter]"></ng-content>
                </footer>
            </aside>
        </div>
    `,
    styleUrls: ['./mb-drawer.component.scss']
})
export class MbDrawerComponent {
    @Input() open = false;
    @Input() title?: string;
    @Input() position: MbDrawerPosition = 'right';
    @Input() hasFooter = false;
    @Input() closeOnBackdrop = true;
    @Input() panelClass?: string | string[] | Set<string> | { [klass: string]: boolean };
    @Input() backdropClass?: string | string[] | Set<string> | { [klass: string]: boolean };
    @Output() closed = new EventEmitter<void>();

    @ContentChild(MbDrawerFooterDirective) footerSlot?: MbDrawerFooterDirective;

    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.open) {
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
