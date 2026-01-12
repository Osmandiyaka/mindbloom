import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MbComboBoxComponent, MbComboBoxOption } from '@mindbloom/ui';

@Component({
    selector: 'app-country-select',
    standalone: true,
    imports: [CommonModule, MbComboBoxComponent],
    template: `
        <mb-combobox
            [id]="id"
            [name]="name"
            [placeholder]="placeholder"
            [ariaLabel]="ariaLabel"
            [invalid]="invalid"
            [disabled]="disabled"
            [options]="options"
            [value]="value"
            (valueChange)="valueChange.emit($event)"
            (blurEvent)="blurEvent.emit()"
        ></mb-combobox>
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

    readonly options: MbComboBoxOption[] = this.buildOptions();

    private buildOptions(): MbComboBoxOption[] {
        try {
            const regions = (Intl as any).supportedValuesOf?.('region') || [];
            const display = new Intl.DisplayNames(['en'], { type: 'region' });
            return regions.map((code: string) => {
                const label = display.of(code) || code;
                return { label, value: label };
            });
        } catch {
            return [{ label: 'United States', value: 'United States' }];
        }
    }
}
