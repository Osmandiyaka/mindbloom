import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type MbInputSize = 'sm' | 'md';

@Component({
    selector: 'mb-input',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="mb-input-shell" [class.mb-input-shell--sm]="size === 'sm'">
            <input
                class="mb-input"
                [attr.id]="id || null"
                [attr.name]="name || null"
                [attr.type]="type"
                [attr.placeholder]="placeholder || null"
                [attr.autocomplete]="autocomplete || null"
                [attr.aria-label]="ariaLabel || null"
                [attr.aria-invalid]="invalid || null"
                [attr.autofocus]="autofocus ? '' : null"
                [disabled]="disabled"
                [readonly]="readonly"
                [value]="value"
                (input)="onInput($event)"
                (focus)="handleFocus()"
                (blur)="handleBlur()"
            />
            <button
                *ngIf="clearable && value"
                type="button"
                class="mb-input__clear"
                (click)="clearValue()"
                [attr.aria-label]="clearLabel"
            >
                &times;
            </button>
        </div>
    `,
    styleUrls: ['./mb-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MbInputComponent),
            multi: true
        }
    ]
})
export class MbInputComponent implements ControlValueAccessor {
    @Input() id?: string;
    @Input() name?: string;
    @Input() type: string = 'text';
    @Input() placeholder?: string;
    @Input() autocomplete?: string;
    @Input() ariaLabel?: string;
    @Input() autofocus = false;
    @Input() size: MbInputSize = 'md';
    @Input() disabled = false;
    @Input() readonly = false;
    @Input() invalid = false;
    @Input() clearable = false;
    @Input() clearLabel = 'Clear value';
    @Input() value = '';
    @Output() valueChange = new EventEmitter<string>();
    @Output() blurEvent = new EventEmitter<void>();
    @Output() focusEvent = new EventEmitter<void>();

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

    onInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.value = target.value;
        this.onChange(this.value);
        this.valueChange.emit(this.value);
    }

    clearValue(): void {
        this.value = '';
        this.onChange(this.value);
        this.valueChange.emit(this.value);
    }

    handleBlur(): void {
        this.onTouched();
        this.blurEvent.emit();
    }

    handleFocus(): void {
        this.focusEvent.emit();
    }
}
