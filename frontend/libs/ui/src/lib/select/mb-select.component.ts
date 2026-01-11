import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface MbSelectOption {
    label: string;
    value: string;
    disabled?: boolean;
}

@Component({
    selector: 'mb-select',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="mb-select-shell">
            <select
                class="mb-select"
                [attr.id]="id || null"
                [attr.name]="name || null"
                [attr.aria-label]="ariaLabel || null"
                [attr.aria-invalid]="invalid || null"
                [disabled]="disabled"
                [value]="value"
                (change)="onSelect($event)"
                (blur)="handleBlur()"
            >
                <option *ngIf="placeholder" value="" disabled>{{ placeholder }}</option>
                <ng-container *ngIf="options?.length; else projected">
                    <option
                        *ngFor="let option of options"
                        [value]="option.value"
                        [disabled]="option.disabled"
                    >
                        {{ option.label }}
                    </option>
                </ng-container>
                <ng-template #projected>
                    <ng-content></ng-content>
                </ng-template>
            </select>
            <span class="mb-select__chevron" aria-hidden="true">▾</span>
        </div>
    `,
    styleUrls: ['./mb-select.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MbSelectComponent),
            multi: true
        }
    ]
})
export class MbSelectComponent implements ControlValueAccessor {
    @Input() id?: string;
    @Input() name?: string;
    @Input() ariaLabel?: string;
    @Input() placeholder?: string;
    @Input() disabled = false;
    @Input() invalid = false;
    @Input() options: MbSelectOption[] = [];
    @Output() valueChange = new EventEmitter<string>();

    value = '';
    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(value: string | null): void {
        this.value = value ?? '';
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(disabled: boolean): void {
        this.disabled = disabled;
    }

    onSelect(event: Event): void {
        const target = event.target as HTMLSelectElement;
        this.value = target.value;
        this.onChange(this.value);
        this.valueChange.emit(this.value);
    }

    handleBlur(): void {
        this.onTouched();
    }
}
