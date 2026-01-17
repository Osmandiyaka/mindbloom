import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MbInputComponent, MbSelectComponent, MbSelectOption } from '@mindbloom/ui';

@Component({
    selector: 'app-department-selector',
    standalone: true,
    imports: [CommonModule, MbSelectComponent, MbInputComponent],
    template: `
        <ng-container *ngIf="options.length; else freeText">
            <mb-select
                [value]="value"
                [options]="selectOptions"
                [placeholder]="placeholder"
                [disabled]="disabled"
                (valueChange)="valueChange.emit($event)">
            </mb-select>
        </ng-container>
        <ng-template #freeText>
            <mb-input
                [value]="value"
                [placeholder]="placeholder"
                [disabled]="disabled"
                (valueChange)="valueChange.emit($event)">
            </mb-input>
        </ng-template>
    `,
})
export class DepartmentSelectorComponent {
    @Input() options: string[] = [];
    @Input() value = '';
    @Input() placeholder = 'Select department';
    @Input() disabled = false;
    @Output() valueChange = new EventEmitter<string>();

    get selectOptions(): MbSelectOption[] {
        return this.options.map(option => ({ label: option, value: option }));
    }
}
