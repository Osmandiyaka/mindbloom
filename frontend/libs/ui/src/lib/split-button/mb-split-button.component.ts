import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ConnectedPosition, OverlayModule, CdkOverlayOrigin } from '@angular/cdk/overlay';

export type MbSplitButtonSize = 'sm' | 'md' | 'lg';
export type MbSplitButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface MbSplitButtonItem {
    label?: string;
    value?: string;
    description?: string;
    disabled?: boolean;
    danger?: boolean;
    type?: 'item' | 'divider';
}

@Component({
    selector: 'mb-split-button',
    standalone: true,
    imports: [CommonModule, OverlayModule],
    template: `
        <div
            #root
            class="mb-split-button"
            [class.mb-split-button--primary]="variant === 'primary'"
            [class.mb-split-button--secondary]="variant === 'secondary'"
            [class.mb-split-button--ghost]="variant === 'ghost'"
            [class.mb-split-button--sm]="size === 'sm'"
            [class.mb-split-button--md]="size === 'md'"
            [class.mb-split-button--lg]="size === 'lg'"
            [class.mb-split-button--disabled]="disabled || loading"
            [class.mb-split-button--open]="open"
            cdkOverlayOrigin
            #origin="cdkOverlayOrigin"
        >
            <button
                type="button"
                class="mb-split-button__primary"
                [disabled]="disabled || loading"
                (click)="handlePrimaryClick()"
            >
                <span class="mb-split-button__label" [class.mb-split-button__label--hidden]="loading">{{ label }}</span>
                <span *ngIf="loading" class="mb-split-button__spinner" aria-hidden="true"></span>
            </button>
            <button
                type="button"
                class="mb-split-button__toggle"
                [disabled]="disabled || loading"
                [attr.aria-haspopup]="'menu'"
                [attr.aria-expanded]="open"
                (click)="toggleMenu()"
                (keydown)="handleToggleKeydown($event)"
            >
                <svg class="mb-split-button__chevron" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </button>
        </div>

        <ng-template
            cdkConnectedOverlay
            [cdkConnectedOverlayOrigin]="origin"
            [cdkConnectedOverlayOpen]="open"
            [cdkConnectedOverlayHasBackdrop]="true"
            [cdkConnectedOverlayBackdropClass]="'mb-split-button__backdrop'"
            [cdkConnectedOverlayPositions]="positions"
            [cdkConnectedOverlayPanelClass]="'mb-split-button__overlay'"
            (backdropClick)="closeMenu()"
            (detach)="closeMenu()"
        >
            <div class="mb-split-button__menu" role="menu" [style.minWidth.px]="220" [style.width.px]="menuWidth">
                <ng-container *ngFor="let item of items; let i = index">
                    <div *ngIf="item.type === 'divider'" class="mb-split-button__divider" role="separator"></div>
                    <button
                        *ngIf="item.type !== 'divider'"
                        #menuItem
                        type="button"
                        class="mb-split-button__item"
                        [class.mb-split-button__item--danger]="item.danger"
                        [disabled]="item.disabled"
                        (click)="selectItem(item)"
                    >
                        <span class="mb-split-button__item-label">{{ item.label }}</span>
                        <span *ngIf="item.description" class="mb-split-button__item-desc">{{ item.description }}</span>
                    </button>
                </ng-container>
            </div>
        </ng-template>
    `,
    styleUrls: ['./mb-split-button.component.scss']
})
export class MbSplitButtonComponent {
    @Input() label = '';
    @Input() items: MbSplitButtonItem[] = [];
    @Input() disabled = false;
    @Input() loading = false;
    @Input() size: MbSplitButtonSize = 'md';
    @Input() variant: MbSplitButtonVariant = 'primary';
    @Output() primaryClick = new EventEmitter<void>();
    @Output() itemSelect = new EventEmitter<string>();

    @ViewChild('root', { static: true }) root?: ElementRef<HTMLElement>;
    @ViewChildren('menuItem') menuItems?: QueryList<ElementRef<HTMLButtonElement>>;

    open = false;
    menuWidth = 220;

    readonly positions: ConnectedPosition[] = [
        {
            originX: 'end',
            originY: 'bottom',
            overlayX: 'end',
            overlayY: 'top',
            offsetY: 8,
        }
    ];

    handlePrimaryClick(): void {
        if (this.disabled || this.loading) return;
        this.primaryClick.emit();
    }

    toggleMenu(): void {
        if (this.disabled || this.loading) return;
        this.open = !this.open;
        if (this.open) {
            this.updateMenuWidth();
            this.focusFirstItem();
        }
    }

    closeMenu(): void {
        this.open = false;
    }

    handleToggleKeydown(event: KeyboardEvent): void {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!this.open) {
                this.open = true;
                this.updateMenuWidth();
            }
            this.focusFirstItem();
        }
        if (event.key === 'Escape') {
            this.closeMenu();
        }
    }

    selectItem(item: MbSplitButtonItem): void {
        if (item.disabled || !item.value) return;
        this.itemSelect.emit(item.value);
        this.closeMenu();
    }

    private updateMenuWidth(): void {
        const width = this.root?.nativeElement.getBoundingClientRect().width || 0;
        this.menuWidth = Math.max(220, Math.round(width));
    }

    private focusFirstItem(): void {
        setTimeout(() => {
            const first = this.menuItems?.find(item => !item.nativeElement.disabled);
            first?.nativeElement.focus();
        });
    }
}
