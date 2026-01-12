import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ComboOption = { label: string; value: string };

export const COUNTRY_OPTIONS: ComboOption[] = [
    { label: 'Argentina', value: 'Argentina' },
    { label: 'Australia', value: 'Australia' },
    { label: 'Austria', value: 'Austria' },
    { label: 'Belgium', value: 'Belgium' },
    { label: 'Brazil', value: 'Brazil' },
    { label: 'Canada', value: 'Canada' },
    { label: 'Chile', value: 'Chile' },
    { label: 'China', value: 'China' },
    { label: 'Colombia', value: 'Colombia' },
    { label: 'Denmark', value: 'Denmark' },
    { label: 'Egypt', value: 'Egypt' },
    { label: 'Finland', value: 'Finland' },
    { label: 'France', value: 'France' },
    { label: 'Germany', value: 'Germany' },
    { label: 'Ghana', value: 'Ghana' },
    { label: 'Greece', value: 'Greece' },
    { label: 'India', value: 'India' },
    { label: 'Indonesia', value: 'Indonesia' },
    { label: 'Ireland', value: 'Ireland' },
    { label: 'Israel', value: 'Israel' },
    { label: 'Italy', value: 'Italy' },
    { label: 'Japan', value: 'Japan' },
    { label: 'Kenya', value: 'Kenya' },
    { label: 'Malaysia', value: 'Malaysia' },
    { label: 'Mexico', value: 'Mexico' },
    { label: 'Morocco', value: 'Morocco' },
    { label: 'Netherlands', value: 'Netherlands' },
    { label: 'New Zealand', value: 'New Zealand' },
    { label: 'Nigeria', value: 'Nigeria' },
    { label: 'Norway', value: 'Norway' },
    { label: 'Pakistan', value: 'Pakistan' },
    { label: 'Peru', value: 'Peru' },
    { label: 'Philippines', value: 'Philippines' },
    { label: 'Poland', value: 'Poland' },
    { label: 'Portugal', value: 'Portugal' },
    { label: 'Qatar', value: 'Qatar' },
    { label: 'Saudi Arabia', value: 'Saudi Arabia' },
    { label: 'Singapore', value: 'Singapore' },
    { label: 'South Africa', value: 'South Africa' },
    { label: 'South Korea', value: 'South Korea' },
    { label: 'Spain', value: 'Spain' },
    { label: 'Sweden', value: 'Sweden' },
    { label: 'Switzerland', value: 'Switzerland' },
    { label: 'Tanzania', value: 'Tanzania' },
    { label: 'Turkey', value: 'Turkey' },
    { label: 'Uganda', value: 'Uganda' },
    { label: 'Ukraine', value: 'Ukraine' },
    { label: 'United Arab Emirates', value: 'United Arab Emirates' },
    { label: 'United Kingdom', value: 'United Kingdom' },
    { label: 'United States', value: 'United States' },
    { label: 'Vietnam', value: 'Vietnam' }
];

@Component({
    selector: 'app-country-select',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="mb-combobox-shell" [class.is-open]="open">
            <input
                class="mb-combobox-input"
                [attr.id]="id || undefined"
                [attr.name]="name || undefined"
                [attr.placeholder]="placeholder || undefined"
                [attr.aria-label]="ariaLabel || undefined"
                [attr.aria-invalid]="invalid ? 'true' : undefined"
                [attr.role]="'combobox'"
                [attr.aria-expanded]="open"
                [disabled]="disabled"
                [value]="query"
                (focus)="openList()"
                (input)="onInput($event)"
                (blur)="onBlur()"
            />
            <button type="button" class="mb-combobox-toggle" (click)="toggle()" [disabled]="disabled" aria-label="Toggle list">
                ▾
            </button>
            <div class="mb-combobox-list" *ngIf="open">
                <div
                    class="mb-combobox-option"
                    *ngFor="let option of filteredOptions"
                    (mousedown)="selectOption(option)"
                >
                    {{ option.label }}
                </div>
                <div class="mb-combobox-empty" *ngIf="!filteredOptions.length">
                    No matches found
                </div>
            </div>
        </div>
    `,
    styleUrls: ['./country-select.component.scss']
})
export class CountrySelectComponent {
    @Input() id?: string;
    @Input() name?: string;
    @Input() placeholder?: string;
    @Input() ariaLabel?: string;
    @Input() disabled = false;
    @Input() invalid = false;
    @Input() value = '';

    @Output() valueChange = new EventEmitter<string>();
    @Output() blurEvent = new EventEmitter<void>();

    readonly options = this.buildOptions();
    open = false;
    query = '';

    get filteredOptions() {
        const value = this.query.trim().toLowerCase();
        if (!value) return this.options;
        return this.options.filter(option => option.label.toLowerCase().includes(value));
    }

    ngOnInit(): void {
        this.query = this.value || '';
    }

    ngOnChanges(): void {
        if (!this.open) {
            this.query = this.value || '';
        }
    }

    openList(): void {
        if (this.disabled) return;
        this.open = true;
    }

    toggle(): void {
        if (this.disabled) return;
        this.open = !this.open;
    }

    onInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.query = target.value;
        this.valueChange.emit(this.query);
        if (!this.open) this.open = true;
    }

    onBlur(): void {
        this.blurEvent.emit();
        setTimeout(() => {
            this.open = false;
            this.query = this.value || this.query;
        }, 100);
    }

    selectOption(option: ComboOption): void {
        this.query = option.label;
        this.valueChange.emit(option.value);
        this.open = false;
    }

    private buildOptions(): ComboOption[] {
        return COUNTRY_OPTIONS;
    }
}
