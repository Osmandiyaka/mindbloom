import { CommonModule } from '@angular/common';
import { Component, ElementRef, EmbeddedViewRef, EventEmitter, HostListener, Input, OnDestroy, Output, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { MbInputComponent } from '../input/mb-input.component';

export type MbStaffSelectorOption = {
    id: string;
    name: string;
    email?: string;
    role?: string;
};

@Component({
    selector: 'mb-staff-selector',
    standalone: true,
    imports: [CommonModule, OverlayModule, MbInputComponent],
    template: `
        <div class="mb-staff-selector" #host [class.mb-staff-selector--disabled]="disabled">
            <div
                class="mb-staff-selector__field"
                #field
                tabindex="0"
                role="combobox"
                [attr.aria-expanded]="open"
                [attr.aria-disabled]="disabled"
                (click)="handleFieldClick()"
                (keydown)="handleFieldKeydown($event)"
            >
                <div class="mb-staff-selector__value">
                    <div *ngIf="selectedOption; else placeholderTpl" class="mb-staff-selector__text">
                        <div class="mb-staff-selector__name">{{ selectedOption.name }}</div>
                        <div class="mb-staff-selector__meta" *ngIf="selectedOption.email || selectedOption.role">
                            {{ selectedOption.email || selectedOption.role }}
                        </div>
                    </div>
                    <ng-template #placeholderTpl>
                        <span class="mb-staff-selector__placeholder">{{ placeholder }}</span>
                    </ng-template>
                </div>
                <button
                    *ngIf="allowClear && selectedOption && !disabled"
                    type="button"
                    class="mb-staff-selector__clear"
                    (click)="clear($event)"
                    aria-label="Clear selection"
                >
                    ×
                </button>
                <span class="mb-staff-selector__chevron" aria-hidden="true">▾</span>
            </div>

            <ng-template #overlayPanel>
                <div class="mb-staff-selector__panel" role="listbox">
                    <mb-input
                        class="mb-staff-selector__search"
                        [value]="search"
                        [disabled]="disabled"
                        [placeholder]="searchPlaceholder"
                        (valueChange)="updateSearch($event)"
                    ></mb-input>
                    <button
                        *ngIf="allowClear && selectedOption"
                        type="button"
                        class="mb-staff-selector__option mb-staff-selector__option--clear"
                        (click)="clearSelection()"
                        role="option"
                    >
                        Clear selection
                    </button>
                    <div class="mb-staff-selector__list" *ngIf="filteredOptions.length; else emptyState">
                        <button
                            *ngFor="let option of filteredOptions"
                            type="button"
                            class="mb-staff-selector__option"
                            [class.is-selected]="option.id === value"
                            (click)="select(option)"
                            role="option"
                        >
                            <div class="mb-staff-selector__option-name">{{ option.name }}</div>
                            <div class="mb-staff-selector__option-meta" *ngIf="option.email || option.role">
                                {{ option.email || option.role }}
                            </div>
                        </button>
                    </div>
                    <ng-template #emptyState>
                        <div class="mb-staff-selector__empty">{{ emptyText }}</div>
                    </ng-template>
                </div>
            </ng-template>
        </div>
    `,
    styleUrls: ['./mb-staff-selector.component.scss']
})
export class MbStaffSelectorComponent implements OnDestroy {
    @Input() options: MbStaffSelectorOption[] = [];
    @Input() value: string | null | undefined;
    @Input() placeholder = 'Select staff';
    @Input() searchPlaceholder = 'Search staff...';
    @Input() emptyText = 'No staff found';
    @Input() disabled = false;
    @Input() allowClear = true;
    @Output() valueChange = new EventEmitter<string | null>();

    @ViewChild('host', { static: true }) host?: ElementRef<HTMLElement>;
    @ViewChild('field', { static: true }) field?: ElementRef<HTMLElement>;
    @ViewChild('overlayPanel') overlayPanel?: TemplateRef<unknown>;

    open = false;
    search = '';
    fieldWidth = 280;
    private ignoreOutsideClick = false;
    private overlayElement?: HTMLElement;
    private overlayView?: EmbeddedViewRef<unknown>;

    get selectedOption(): MbStaffSelectorOption | undefined {
        const id = this.value || '';
        return this.options.find(option => option.id === id);
    }

    get filteredOptions(): MbStaffSelectorOption[] {
        const term = this.search.trim().toLowerCase();
        if (!term) return this.options;
        return this.options.filter(option => {
            const target = `${option.name} ${option.email || ''} ${option.role || ''}`.toLowerCase();
            return target.includes(term);
        });
    }

    handleFieldClick(): void {
        if (this.disabled) return;
        if (!this.open) {
            this.toggleOpen();
            return;
        }
    }

    handleFieldKeydown(event: KeyboardEvent): void {
        if (this.disabled) return;
        if (event.key === 'Enter' || event.key === 'ArrowDown') {
            event.preventDefault();
            this.openDropdown();
            return;
        }
        if (event.key === 'Escape') {
            this.close();
        }
    }


    updateSearch(value: string): void {
        this.search = value;
    }

    select(option: MbStaffSelectorOption): void {
        this.valueChange.emit(option.id);
        this.close();
    }

    clear(event: MouseEvent): void {
        event.stopPropagation();
        this.clearSelection();
    }

    clearSelection(): void {
        this.valueChange.emit(null);
        this.close();
    }

    @HostListener('document:click', ['$event'])
    handleDocumentClick(event: MouseEvent): void {
        if (!this.open || this.ignoreOutsideClick) return;
        const target = event.target as Node | null;
        if (!target) return;
        if (this.host?.nativeElement.contains(target)) return;
        if (this.overlayElement?.contains(target)) return;
        this.close();
    }

    @HostListener('window:scroll')
    handleWindowScroll(): void {
        if (!this.open) return;
        this.positionOverlay();
    }

    @HostListener('window:resize')
    handleWindowResize(): void {
        if (!this.open) return;
        this.positionOverlay();
    }

    ngOnDestroy(): void {
        this.detachOverlay();
    }

    openDropdown(): void {
        if (this.open || this.disabled) return;
        this.toggleOpen();
    }

    toggleOpen(): void {
        if (this.open) {
            this.close();
            return;
        }
        this.open = true;
        this.updateFieldWidth();
        this.attachOverlay();
        this.ignoreOutsideClick = true;
        setTimeout(() => {
            this.ignoreOutsideClick = false;
        });
    }

    close(): void {
        this.open = false;
        this.search = '';
        this.detachOverlay();
    }

    private updateFieldWidth(): void {
        const width = this.field?.nativeElement.getBoundingClientRect().width ?? 0;
        this.fieldWidth = Math.min(420, Math.max(240, Math.round(width || 280)));
        if (this.overlayElement) {
            this.positionOverlay();
        }
    }

    private attachOverlay(): void {
        if (this.overlayElement || !this.overlayPanel) return;
        const element = document.createElement('div');
        element.className = 'mb-staff-selector__overlay mb-popover-panel mb-popover-panel--above-modal';
        element.style.position = 'fixed';
        element.style.zIndex = '1201';
        element.style.pointerEvents = 'auto';
        this.overlayView = this.viewContainerRef.createEmbeddedView(this.overlayPanel);
        this.overlayView.rootNodes.forEach(node => element.appendChild(node));
        document.body.appendChild(element);
        this.overlayElement = element;
        this.positionOverlay();
    }

    private positionOverlay(): void {
        if (!this.overlayElement || !this.field) return;
        const rect = this.field.nativeElement.getBoundingClientRect();
        const estimatedHeight = 360;
        const gutter = 8;
        let top = rect.bottom + gutter;
        if (top + estimatedHeight > window.innerHeight) {
            top = rect.top - gutter - estimatedHeight;
        }
        top = Math.max(gutter, top);
        let left = rect.left;
        if (left + this.fieldWidth > window.innerWidth) {
            left = Math.max(gutter, window.innerWidth - this.fieldWidth - gutter);
        }
        this.overlayElement.style.top = `${Math.round(top)}px`;
        this.overlayElement.style.left = `${Math.round(left)}px`;
        this.overlayElement.style.width = `${this.fieldWidth}px`;
    }

    private detachOverlay(): void {
        if (!this.overlayElement) return;
        this.overlayView?.destroy();
        this.overlayView = undefined;
        this.overlayElement.remove();
        this.overlayElement = undefined;
    }

    constructor(private readonly viewContainerRef: ViewContainerRef) {}
}
