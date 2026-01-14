import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'mb-checkbox',
    standalone: true,
    imports: [CommonModule],
    template: `
        <label
            class="mb-checkbox"
            [class.mb-checkbox--disabled]="disabled"
            [class.mb-checkbox--indeterminate]="indeterminate && !checked"
        >
            <input
                type="checkbox"
                class="mb-checkbox__input"
                [checked]="checked"
                [indeterminate]="indeterminate"
                [disabled]="disabled"
                [attr.aria-label]="ariaLabel || null"
                (change)="onToggle($event)"
                (blur)="handleBlur()"
            />
            <span class="mb-checkbox__box" aria-hidden="true">
                <svg class="mb-checkbox__icon-check" viewBox="0 0 16 12" width="12" height="10">
                    <path d="M1 6.5 5 10.5 15 1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <svg class="mb-checkbox__icon-minus" viewBox="0 0 16 12" width="12" height="10">
                    <path d="M2 6h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </span>
            <span class="mb-checkbox__label">
                <ng-content></ng-content>
            </span>
        </label>
    `,
    styleUrls: ['./mb-checkbox.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MbCheckboxComponent),
            multi: true
        }
    ]
})
export class MbCheckboxComponent implements ControlValueAccessor {
    @Input() checked = false;
    @Input() disabled = false;
    @Input() indeterminate = false;
    @Input() ariaLabel?: string;
    @Output() checkedChange = new EventEmitter<boolean>();

    private onChange: (value: boolean) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(value: boolean | null): void {
        this.checked = !!value;
    }

    registerOnChange(fn: (value: boolean) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(disabled: boolean): void {
        this.disabled = disabled;
    }

    onToggle(event: Event): void {
        const next = (event.target as HTMLInputElement).checked;
        this.checked = next;
        this.onChange(next);
        this.checkedChange.emit(next);
    }

    handleBlur(): void {
        this.onTouched();
    }
}
