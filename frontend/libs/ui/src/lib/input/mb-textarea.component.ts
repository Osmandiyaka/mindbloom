import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'mb-textarea',
    standalone: true,
    imports: [CommonModule],
    template: `
        <textarea
            class="mb-textarea"
            [attr.id]="id || null"
            [attr.name]="name || null"
            [attr.placeholder]="placeholder || null"
            [attr.rows]="rows"
            [attr.aria-label]="ariaLabel || null"
            [attr.aria-invalid]="invalid || null"
            [disabled]="disabled"
            [readonly]="readonly"
            [value]="value"
            (input)="onInput($event)"
            (blur)="handleBlur()"
        ></textarea>
    `,
    styleUrls: ['./mb-textarea.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MbTextareaComponent),
            multi: true
        }
    ]
})
export class MbTextareaComponent implements ControlValueAccessor {
    @Input() id?: string;
    @Input() name?: string;
    @Input() placeholder?: string;
    @Input() rows = 4;
    @Input() ariaLabel?: string;
    @Input() disabled = false;
    @Input() readonly = false;
    @Input() invalid = false;
    @Input() value = '';
    @Output() valueChange = new EventEmitter<string>();

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
        const target = event.target as HTMLTextAreaElement;
        this.value = target.value;
        this.onChange(this.value);
        this.valueChange.emit(this.value);
    }

    handleBlur(): void {
        this.onTouched();
    }
}
