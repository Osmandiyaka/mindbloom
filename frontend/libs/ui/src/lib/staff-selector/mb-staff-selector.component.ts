import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MbInputComponent } from '../input/mb-input.component';
import { MbPopoverComponent } from '../popover/mb-popover.component';

export type MbStaffSelectorOption = {
    id: string;
    name: string;
    email?: string;
    role?: string;
};

@Component({
    selector: 'mb-staff-selector',
    standalone: true,
    imports: [CommonModule, MbInputComponent, MbPopoverComponent],
    template: `
        <div class="mb-staff-selector" [class.mb-staff-selector--disabled]="disabled">
            <div
                class="mb-staff-selector__field"
                #origin
                tabindex="0"
                role="combobox"
                [attr.aria-expanded]="open"
                [attr.aria-disabled]="disabled"
                (click)="toggle()"
                (keydown)="handleKeydown($event)"
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

            <mb-popover
                [open]="open"
                [origin]="origin"
                [hasBackdrop]="true"
                [panelClass]="['mb-popover-panel', 'mb-popover-panel--above-modal', 'mb-staff-selector__panel']"
                (closed)="close()"
            >
                <div class="mb-staff-selector__panel-content" role="listbox">
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
            </mb-popover>
        </div>
    `,
    styleUrls: ['./mb-staff-selector.component.scss']
})
export class MbStaffSelectorComponent {
    @Input() options: MbStaffSelectorOption[] = [];
    @Input() value: string | null | undefined;
    @Input() placeholder = 'Select staff';
    @Input() searchPlaceholder = 'Search staff...';
    @Input() emptyText = 'No staff found';
    @Input() disabled = false;
    @Input() allowClear = true;
    @Output() valueChange = new EventEmitter<string | null>();

    open = false;
    search = '';

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

    toggle(): void {
        if (this.disabled) return;
        this.open = !this.open;
    }

    close(): void {
        this.open = false;
        this.search = '';
    }

    handleKeydown(event: KeyboardEvent): void {
        if (this.disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.toggle();
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
}
