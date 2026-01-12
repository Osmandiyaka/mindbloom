import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

type ComboOption = { label: string; value: string };

@Component({
    selector: 'app-timezone-select',
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
    styleUrls: ['./timezone-select.component.scss']
})
export class TimezoneSelectComponent {
    @Input() id?: string;
    @Input() name?: string;
    @Input() placeholder?: string;
    @Input() ariaLabel?: string;
    @Input() disabled = false;
    @Input() invalid = false;
    @Input() value = '';

    @Output() valueChange = new EventEmitter<string>();
    @Output() blurEvent = new EventEmitter<void>();

    readonly options: ComboOption[] = this.buildOptions();
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
        return [
            { label: 'UTC', value: 'UTC' },
            { label: 'Africa/Accra', value: 'Africa/Accra' },
            { label: 'Africa/Cairo', value: 'Africa/Cairo' },
            { label: 'Africa/Johannesburg', value: 'Africa/Johannesburg' },
            { label: 'Africa/Lagos', value: 'Africa/Lagos' },
            { label: 'Africa/Nairobi', value: 'Africa/Nairobi' },
            { label: 'America/Chicago', value: 'America/Chicago' },
            { label: 'America/Denver', value: 'America/Denver' },
            { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
            { label: 'America/Mexico_City', value: 'America/Mexico_City' },
            { label: 'America/New_York', value: 'America/New_York' },
            { label: 'America/Sao_Paulo', value: 'America/Sao_Paulo' },
            { label: 'Asia/Dubai', value: 'Asia/Dubai' },
            { label: 'Asia/Hong_Kong', value: 'Asia/Hong_Kong' },
            { label: 'Asia/Jakarta', value: 'Asia/Jakarta' },
            { label: 'Asia/Kolkata', value: 'Asia/Kolkata' },
            { label: 'Asia/Seoul', value: 'Asia/Seoul' },
            { label: 'Asia/Singapore', value: 'Asia/Singapore' },
            { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
            { label: 'Asia/Manila', value: 'Asia/Manila' },
            { label: 'Australia/Melbourne', value: 'Australia/Melbourne' },
            { label: 'Australia/Sydney', value: 'Australia/Sydney' },
            { label: 'Europe/Amsterdam', value: 'Europe/Amsterdam' },
            { label: 'Europe/Berlin', value: 'Europe/Berlin' },
            { label: 'Europe/London', value: 'Europe/London' },
            { label: 'Europe/Madrid', value: 'Europe/Madrid' },
            { label: 'Europe/Paris', value: 'Europe/Paris' },
            { label: 'Europe/Rome', value: 'Europe/Rome' },
            { label: 'Europe/Stockholm', value: 'Europe/Stockholm' },
            { label: 'Europe/Zurich', value: 'Europe/Zurich' }
        ];
    }
}
