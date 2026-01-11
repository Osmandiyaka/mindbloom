import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface MbComboBoxOption {
    label: string;
    value: string;
}

@Component({
    selector: 'mb-combobox',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="mb-combobox-shell">
            <input
                class="mb-combobox"
                [attr.id]="id || null"
                [attr.name]="name || null"
                [attr.list]="listId"
                [attr.placeholder]="placeholder || null"
                [attr.aria-label]="ariaLabel || null"
                [attr.aria-invalid]="invalid || null"
                [disabled]="disabled"
                [value]="value"
                (input)="onInput($event)"
                (blur)="handleBlur()"
            />
            <datalist [id]="listId">
                <option *ngFor="let option of options" [value]="option.value">{{ option.label }}</option>
            </datalist>
        </div>
    `,
    styleUrls: ['./mb-combobox.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MbComboBoxComponent),
            multi: true
        }
    ]
})
export class MbComboBoxComponent implements ControlValueAccessor {
    @Input() id?: string;
    @Input() name?: string;
    @Input() placeholder?: string;
    @Input() ariaLabel?: string;
    @Input() disabled = false;
    @Input() invalid = false;
    @Input() options: MbComboBoxOption[] = [];
    @Input() value = '';
    @Output() valueChange = new EventEmitter<string>();

    listId = `mb-combobox-${Math.random().toString(36).slice(2, 9)}`;
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

    handleBlur(): void {
        this.onTouched();
    }
}
