import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MbInputComponent } from '../input/mb-input.component';
import { MbPopoverComponent } from '../popover/mb-popover.component';

export type MbClassSelectorOption = {
    id: string;
    name: string;
    code?: string;
    levelType?: string;
};

@Component({
    selector: 'mb-class-selector',
    standalone: true,
    imports: [CommonModule, MbInputComponent, MbPopoverComponent],
    template: `
        <div class="mb-class-selector" [class.mb-class-selector--disabled]="disabled">
            <div
                class="mb-class-selector__field"
                #origin
                tabindex="0"
                role="combobox"
                [attr.aria-expanded]="open"
                [attr.aria-disabled]="disabled"
                (click)="toggle()"
                (keydown)="handleKeydown($event)"
            >
                <div class="mb-class-selector__value">
                    <div *ngIf="selectedOption; else placeholderTpl" class="mb-class-selector__text">
                        <div class="mb-class-selector__name">{{ selectedOption.name }}</div>
                        <div class="mb-class-selector__meta" *ngIf="selectedOption.code || selectedOption.levelType">
                            {{ selectedOption.code || selectedOption.levelType }}
                        </div>
                    </div>
                    <ng-template #placeholderTpl>
                        <span class="mb-class-selector__placeholder">{{ placeholder }}</span>
                    </ng-template>
                </div>
                <button
                    *ngIf="allowClear && selectedOption && !disabled"
                    type="button"
                    class="mb-class-selector__clear"
                    (click)="clear($event)"
                    aria-label="Clear selection"
                >
                    ×
                </button>
                <span class="mb-class-selector__chevron" aria-hidden="true">▾</span>
            </div>

            <mb-popover
                [open]="open"
                [origin]="origin"
                [hasBackdrop]="true"
                [panelClass]="['mb-popover-panel', 'mb-popover-panel--above-modal', 'mb-class-selector__panel']"
                (closed)="close()"
            >
                <div class="mb-class-selector__panel-content" role="listbox">
                    <mb-input
                        class="mb-class-selector__search"
                        [value]="search"
                        [disabled]="disabled"
                        [placeholder]="searchPlaceholder"
                        (valueChange)="updateSearch($event)"
                    ></mb-input>
                    <button
                        *ngIf="allowClear && selectedOption"
                        type="button"
                        class="mb-class-selector__option mb-class-selector__option--clear"
                        (click)="clearSelection()"
                        role="option"
                    >
                        Clear selection
                    </button>
                    <div class="mb-class-selector__list" *ngIf="filteredOptions.length; else emptyState">
                        <button
                            *ngFor="let option of filteredOptions"
                            type="button"
                            class="mb-class-selector__option"
                            [class.is-selected]="option.id === value"
                            (click)="select(option)"
                            role="option"
                        >
                            <div class="mb-class-selector__option-name">{{ option.name }}</div>
                            <div class="mb-class-selector__option-meta" *ngIf="option.code || option.levelType">
                                {{ option.code || option.levelType }}
                            </div>
                        </button>
                    </div>
                    <ng-template #emptyState>
                        <div class="mb-class-selector__empty">{{ emptyText }}</div>
                    </ng-template>
                </div>
            </mb-popover>
        </div>
    `,
    styleUrls: ['./mb-class-selector.component.scss']
})
export class MbClassSelectorComponent {
    @Input() options: MbClassSelectorOption[] = [];
    @Input() value: string | null | undefined;
    @Input() placeholder = 'Select class';
    @Input() searchPlaceholder = 'Search classes...';
    @Input() emptyText = 'No classes found';
    @Input() disabled = false;
    @Input() allowClear = true;
    @Output() valueChange = new EventEmitter<string | null>();

    open = false;
    search = '';

    get selectedOption(): MbClassSelectorOption | undefined {
        const id = this.value || '';
        return this.options.find(option => option.id === id);
    }

    get filteredOptions(): MbClassSelectorOption[] {
        const term = this.search.trim().toLowerCase();
        if (!term) return this.options;
        return this.options.filter(option => {
            const target = `${option.name} ${option.code || ''} ${option.levelType || ''}`.toLowerCase();
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

    select(option: MbClassSelectorOption): void {
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
