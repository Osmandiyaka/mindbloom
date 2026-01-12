import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MbComboBoxComponent, MbComboBoxOption } from '@mindbloom/ui';

@Component({
    selector: 'app-timezone-select',
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

    readonly options: MbComboBoxOption[] = this.buildOptions();

    private buildOptions(): MbComboBoxOption[] {
        try {
            const list = (Intl as any).supportedValuesOf?.('timeZone') || [];
            if (list.length) {
                return list.map((tz: string) => ({ label: tz, value: tz }));
            }
        } catch {
            // fall through
        }
        return [
            { label: 'UTC', value: 'UTC' },
            { label: 'America/New_York', value: 'America/New_York' },
            { label: 'Europe/London', value: 'Europe/London' }
        ];
    }
}
