import { CommonModule } from '@angular/common';
import { Component, ElementRef, EmbeddedViewRef, EventEmitter, HostListener, Input, OnDestroy, Output, QueryList, TemplateRef, ViewChild, ViewChildren, ViewContainerRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { MbTooltipDirective } from '../tooltip/mb-tooltip.directive';
import { ApiClient } from '../../../../../src/app/core/http/api-client.service';

export type MbSchoolSelectorOption = {
    id: string;
    name: string;
};

@Component({
    selector: 'mb-school-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, OverlayModule, MbTooltipDirective],
    template: `
        <div class="mb-school-selector" #host [class.mb-school-selector--single]="!multiple">
            <label class="mb-school-selector__label" *ngIf="label">{{ label }}</label>
            <div
                #field
                class="mb-school-selector__field"
                tabindex="0"
                role="combobox"
                [attr.aria-expanded]="open"
                [attr.aria-disabled]="disabled || readOnly"
                [class.mb-school-selector__field--open]="open"
                [class.mb-school-selector__field--disabled]="disabled"
                [class.mb-school-selector__field--readonly]="readOnly"
                (click)="handleFieldClick()"
                (keydown)="handleFieldKeydown($event)"
            >
                <span class="mb-school-selector__field-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M4 9l8-4 8 4-8 4-8-4z" stroke="currentColor" stroke-width="1.6"/>
                        <path d="M8 12v6m4-6v6m4-6v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                    </svg>
                </span>
                <div class="mb-school-selector__chips" [class.mb-school-selector__chips--empty]="!selectedOptions.length">
                    <ng-container *ngFor="let school of visibleSelectedOptions">
                        <span class="mb-school-chip">
                            <span class="mb-school-chip__label">{{ school.name }}</span>
                            <button
                                *ngIf="!disabled && !readOnly"
                                type="button"
                                class="mb-school-chip__remove"
                                (click)="removeSchool(school, $event)"
                                aria-label="Remove school"
                            >
                                ×
                            </button>
                        </span>
                    </ng-container>
                    <button
                        *ngIf="hiddenSelectedOptions.length"
                        type="button"
                        class="mb-school-chip mb-school-chip--more"
                        [mbTooltip]="hiddenSchoolsTooltip"
                        (click)="$event.stopPropagation()"
                    >
                        +{{ hiddenSelectedOptions.length }} more
                    </button>
                    <span class="mb-school-selector__placeholder" *ngIf="!selectedOptions.length">{{ placeholder }}</span>
                </div>
                <span class="mb-school-selector__chevron" aria-hidden="true">
                    <svg viewBox="0 0 16 16" fill="none">
                        <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
            </div>

            <ng-template #overlayPanel>
                <div
                    #popoverPanel
                    class="mb-school-selector__popover"
                    (keydown)="handlePopoverKeydown($event)"
                    [style.width.px]="fieldWidth"
                >
                    <div class="mb-school-selector__search">
                        <span class="mb-school-selector__search-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none">
                                <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"></circle>
                                <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
                            </svg>
                        </span>
                        <input
                            #searchInput
                            type="text"
                            class="mb-school-selector__search-input"
                            [placeholder]="searchPlaceholder"
                            [value]="searchValue"
                            [disabled]="disabled"
                            (input)="handleSearchInput($event)"
                        />
                    </div>

                    <div class="mb-school-selector__content">
                        <div *ngIf="loading" class="mb-school-selector__loading">
                            <div class="mb-school-selector__skeleton" *ngFor="let _ of skeletonRows"></div>
                        </div>

                        <div *ngIf="errorMessage" class="mb-school-selector__error">
                            <div class="mb-school-selector__error-text">Couldn't load schools.</div>
                            <button type="button" class="mb-school-selector__error-action" (click)="loadSchools()">Retry</button>
                        </div>

                        <ng-container *ngIf="!loading && !errorMessage">
                            <div
                                *ngIf="showSelectedSection && selectedOptions.length"
                                class="mb-school-selector__section"
                            >
                                <div class="mb-school-selector__section-title">Selected</div>
                                <div class="mb-school-selector__list" role="listbox" [attr.aria-multiselectable]="multiple">
                                    <button
                                        *ngFor="let school of selectedOptions"
                                        #schoolOption
                                        type="button"
                                        class="mb-school-selector__option"
                                        [class.mb-school-selector__option--selected]="isSelected(school)"
                                        (click)="toggleSchool(school)"
                                        role="option"
                                        [attr.aria-selected]="isSelected(school)"
                                    >
                                        <span class="mb-school-selector__option-main">
                                            <span class="mb-school-selector__option-name">{{ school.name }}</span>
                                        </span>
                                        <span class="mb-school-selector__option-control" aria-hidden="true">
                                            <span
                                                class="mb-school-selector__checkbox"
                                                [class.mb-school-selector__checkbox--selected]="isSelected(school)"
                                                [class.mb-school-selector__checkbox--radio]="!multiple"
                                            ></span>
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <ng-container *ngIf="filteredOptions.length; else emptyState">
                                <div class="mb-school-selector__section">
                                    <div class="mb-school-selector__section-title">Schools</div>
                                    <div class="mb-school-selector__list" role="listbox" [attr.aria-multiselectable]="multiple">
                                        <button
                                            *ngFor="let school of filteredOptions"
                                            #schoolOption
                                            type="button"
                                            class="mb-school-selector__option"
                                            [class.mb-school-selector__option--selected]="isSelected(school)"
                                            (click)="toggleSchool(school)"
                                            role="option"
                                            [attr.aria-selected]="isSelected(school)"
                                        >
                                            <span class="mb-school-selector__option-main">
                                                <span class="mb-school-selector__option-name">
                                                    <ng-container *ngFor="let part of highlightParts(school.name)">
                                                        <span [class.mb-school-selector__match]="part.match">{{ part.text }}</span>
                                                    </ng-container>
                                                </span>
                                            </span>
                                            <span class="mb-school-selector__option-control" aria-hidden="true">
                                                <span
                                                    class="mb-school-selector__checkbox"
                                                    [class.mb-school-selector__checkbox--selected]="isSelected(school)"
                                                    [class.mb-school-selector__checkbox--radio]="!multiple"
                                                ></span>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </ng-container>
                            <ng-template #emptyState>
                                <div class="mb-school-selector__empty">
                                    {{ debouncedSearch ? "No schools match '" + debouncedSearch + "'" : emptyText }}
                                </div>
                            </ng-template>
                        </ng-container>
                    </div>

                    <div class="mb-school-selector__footer" *ngIf="!readOnly">
                        <button type="button" class="mb-school-selector__footer-button" (click)="clearSelection()">Clear</button>
                        <button type="button" class="mb-school-selector__footer-button mb-school-selector__footer-button--primary" (click)="close()">
                            Done
                        </button>
                    </div>
                </div>
            </ng-template>
        </div>
    `,
    styleUrls: ['./mb-school-selector.component.scss']
})
export class MbSchoolSelectorComponent implements OnDestroy {
    private readonly api = inject(ApiClient);

    @Input() options: MbSchoolSelectorOption[] = [];
    @Input() value: string[] = [];
    @Input() label = 'Schools';
    @Input() placeholder = 'Select schools...';
    @Input() searchPlaceholder = 'Search schools';
    @Input() emptyText = 'No schools found';
    @Input() multiple = true;
    @Input() disabled = false;
    @Input() readOnly = false;
    @Input() maxVisibleChips = 2;
    @Input() showSelectedSection = true;

    @Output() valueChange = new EventEmitter<string[]>();
    @Output() change = new EventEmitter<{ ids: string[]; options?: MbSchoolSelectorOption[] }>();

    @ViewChild('host', { static: true }) host?: ElementRef<HTMLElement>;
    @ViewChild('field', { static: true }) field?: ElementRef<HTMLElement>;
    @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
    @ViewChild('overlayPanel') overlayPanel?: TemplateRef<unknown>;
    @ViewChild('popoverPanel') popoverPanel?: ElementRef<HTMLElement>;
    @ViewChildren('schoolOption') schoolOptions?: QueryList<ElementRef<HTMLButtonElement>>;

    open = false;
    searchValue = '';
    debouncedSearch = '';
    fieldWidth = 360;
    activeIndex = -1;
    loading = false;
    errorMessage = '';
    skeletonRows = Array.from({ length: 5 });
    private ignoreOutsideClick = false;
    private overlayElement?: HTMLElement;
    private overlayView?: EmbeddedViewRef<unknown>;
    private searchTimer?: number;
    private static cachedSchools: MbSchoolSelectorOption[] | null = null;

    private get availableSchools(): MbSchoolSelectorOption[] {
        const merged = [...this.internalSchools, ...this.options];
        const seen = new Set<string>();
        return merged.filter(option => {
            if (!option?.id || seen.has(option.id)) return false;
            seen.add(option.id);
            return true;
        });
    }

    private internalSchools: MbSchoolSelectorOption[] = [];

    get selectedOptions(): MbSchoolSelectorOption[] {
        return this.value.map(value => this.findSchoolByValue(value) ?? { id: value, name: value });
    }

    get visibleSelectedOptions(): MbSchoolSelectorOption[] {
        return this.selectedOptions.slice(0, this.maxVisibleChips);
    }

    get hiddenSelectedOptions(): MbSchoolSelectorOption[] {
        return this.selectedOptions.slice(this.maxVisibleChips);
    }

    get hiddenSchoolsTooltip(): string {
        return this.hiddenSelectedOptions.map(school => school.name).join(', ');
    }

    get filteredOptions(): MbSchoolSelectorOption[] {
        const search = this.debouncedSearch.trim().toLowerCase();
        const selectedValues = new Set(this.value);
        const list = this.availableSchools.filter(option => {
            if (!search) return true;
            return option.name.toLowerCase().includes(search);
        });
        if (this.showSelectedSection && this.selectedOptions.length) {
            return list.filter(option => !selectedValues.has(option.id));
        }
        return list;
    }

    handleFieldClick(): void {
        if (this.disabled || this.readOnly) return;
        if (!this.open) {
            this.toggleOpen();
            return;
        }
        this.focusSearchInput();
    }

    handleFieldKeydown(event: KeyboardEvent): void {
        if (this.disabled || this.readOnly) return;
        if (event.key === 'Enter' || event.key === 'ArrowDown') {
            event.preventDefault();
            this.openDropdown();
            return;
        }
        if (event.key === 'Escape') {
            this.close();
        }
        if (event.key === 'Backspace' && !this.searchValue) {
            this.removeLastSchool();
        }
    }

    handlePopoverKeydown(event: KeyboardEvent): void {
        if (!this.open) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
            return;
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            this.moveActive(event.key === 'ArrowDown' ? 1 : -1);
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            this.selectActive();
        }
        if (event.key === 'Backspace' && !this.searchValue) {
            this.removeLastSchool();
        }
    }

    handleSearchInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.searchValue = target.value;
        if (this.searchTimer) {
            window.clearTimeout(this.searchTimer);
        }
        this.searchTimer = window.setTimeout(() => {
            this.debouncedSearch = this.searchValue;
            this.resetActiveIndex();
        }, 150);
    }

    toggleSchool(school: MbSchoolSelectorOption): void {
        if (this.disabled || this.readOnly) return;
        if (this.multiple) {
            const selected = this.value.filter(value => value !== school.id);
            if (this.isSelected(school)) {
                this.emitSelection(selected);
                return;
            }
            this.emitSelection([...selected, school.id]);
            return;
        }
        this.emitSelection([school.id]);
        this.close();
    }

    removeSchool(school: MbSchoolSelectorOption, event: MouseEvent): void {
        event.stopPropagation();
        if (this.disabled || this.readOnly) return;
        const next = this.value.filter(value => value !== school.id);
        this.emitSelection(next);
    }

    clearSelection(): void {
        if (this.disabled || this.readOnly) return;
        this.emitSelection([]);
        this.searchValue = '';
        this.debouncedSearch = '';
    }

    highlightParts(name: string): Array<{ text: string; match: boolean }> {
        const query = this.debouncedSearch.trim();
        if (!query) {
            return [{ text: name, match: false }];
        }
        const lowerName = name.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerName.indexOf(lowerQuery);
        if (index === -1) {
            return [{ text: name, match: false }];
        }
        const before = name.slice(0, index);
        const match = name.slice(index, index + query.length);
        const after = name.slice(index + query.length);
        return [
            { text: before, match: false },
            { text: match, match: true },
            { text: after, match: false }
        ];
    }

    isSelected(school: MbSchoolSelectorOption): boolean {
        return this.value.includes(school.id);
    }

    openDropdown(): void {
        if (this.open || this.disabled || this.readOnly) return;
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
        this.resetActiveIndex();
        this.loadSchools();
        this.ignoreOutsideClick = true;
        this.focusSearchInput();
        setTimeout(() => {
            this.ignoreOutsideClick = false;
        });
    }

    close(): void {
        this.open = false;
        this.activeIndex = -1;
        this.detachOverlay();
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
        if (!this.open || !this.overlayElement) return;
        this.positionOverlay();
    }

    @HostListener('window:resize')
    handleWindowResize(): void {
        if (!this.open || !this.overlayElement) return;
        this.positionOverlay();
    }

    ngOnDestroy(): void {
        if (this.searchTimer) {
            window.clearTimeout(this.searchTimer);
        }
        this.detachOverlay();
    }

    loadSchools(): void {
        if (this.loading) return;
        if (MbSchoolSelectorComponent.cachedSchools?.length) {
            this.internalSchools = [...MbSchoolSelectorComponent.cachedSchools];
            return;
        }
        this.loading = true;
        this.errorMessage = '';
        this.api.get<unknown>('/api/schools').subscribe({
            next: response => {
                const schools = this.normalizeSchools(response);
                this.internalSchools = schools;
                MbSchoolSelectorComponent.cachedSchools = schools;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.errorMessage = 'error';
            }
        });
    }

    private emitSelection(ids: string[]): void {
        this.value = ids;
        const options = ids.map(id => this.findSchoolByValue(id)).filter(Boolean) as MbSchoolSelectorOption[];
        this.valueChange.emit(ids);
        this.change.emit({ ids, options });
    }

    private findSchoolByValue(value: string): MbSchoolSelectorOption | undefined {
        return this.availableSchools.find(option => option.id === value);
    }

    private normalizeSchools(response: unknown): MbSchoolSelectorOption[] {
        if (Array.isArray(response)) {
            return response
                .map(item => this.coerceSchool(item))
                .filter(Boolean) as MbSchoolSelectorOption[];
        }
        if (response && typeof response === 'object') {
            if ('data' in response && Array.isArray((response as { data: unknown[] }).data)) {
                return (response as { data: unknown[] }).data
                    .map(item => this.coerceSchool(item))
                    .filter(Boolean) as MbSchoolSelectorOption[];
            }
            if ('items' in response && Array.isArray((response as { items: unknown[] }).items)) {
                return (response as { items: unknown[] }).items
                    .map(item => this.coerceSchool(item))
                    .filter(Boolean) as MbSchoolSelectorOption[];
            }
        }
        return [];
    }

    private coerceSchool(value: unknown): MbSchoolSelectorOption | null {
        if (!value || typeof value !== 'object') return null;
        const record = value as { id?: string; _id?: string; name?: string };
        const id = record.id || record._id;
        const name = record.name;
        if (!id || !name) return null;
        return { id, name };
    }

    private updateFieldWidth(): void {
        const width = this.field?.nativeElement.getBoundingClientRect().width ?? 0;
        this.fieldWidth = Math.min(480, Math.round(width || 360));
        if (this.overlayElement) {
            this.positionOverlay();
        }
    }

    private resetActiveIndex(): void {
        this.activeIndex = -1;
    }

    private attachOverlay(): void {
        if (this.overlayElement || !this.overlayPanel || !this.field) return;
        const element = document.createElement('div');
        element.className = 'mb-school-selector__overlay mb-popover-panel mb-popover-panel--above-modal';
        element.style.position = 'fixed';
        element.style.zIndex = '1201';
        element.style.pointerEvents = 'auto';
        document.body.appendChild(element);

        this.overlayView = this.viewContainerRef.createEmbeddedView(this.overlayPanel);
        this.overlayView.rootNodes.forEach(node => element.appendChild(node));
        this.overlayElement = element;
        this.positionOverlay();
    }

    private positionOverlay(): void {
        if (!this.overlayElement || !this.field) return;
        const rect = this.field.nativeElement.getBoundingClientRect();
        const estimatedHeight = 420;
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

    private moveActive(delta: number): void {
        const options = this.schoolOptions?.toArray() ?? [];
        if (!options.length) return;
        const nextIndex = this.activeIndex < 0 ? 0 : this.activeIndex + delta;
        const next = Math.min(Math.max(nextIndex, 0), options.length - 1);
        this.activeIndex = next;
        this.focusActive();
    }

    private selectActive(): void {
        const options = this.schoolOptions?.toArray() ?? [];
        if (!options.length || this.activeIndex < 0) return;
        options[this.activeIndex].nativeElement.click();
    }

    private focusActive(): void {
        const options = this.schoolOptions?.toArray() ?? [];
        if (!options.length || this.activeIndex < 0) return;
        setTimeout(() => {
            options[this.activeIndex]?.nativeElement.focus();
        });
    }

    private removeLastSchool(): void {
        if (!this.value.length) return;
        const next = this.value.slice(0, -1);
        this.emitSelection(next);
    }

    private focusSearchInput(): void {
        setTimeout(() => {
            this.searchInput?.nativeElement.focus();
        });
    }

    constructor(private readonly viewContainerRef: ViewContainerRef) { }
}
