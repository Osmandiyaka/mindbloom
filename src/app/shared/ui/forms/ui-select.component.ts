import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface UiSelectOption {
    label: string;
    value: string | number;
}

@Component({
    selector: 'ui-select',
    standalone: true,
    imports: [CommonModule],
    template: `
    <select [disabled]="disabledState" [value]="value" (change)="onChange($event)" class="ui-select">
      <ng-content></ng-content>
    </select>
  `,
    styles: [`
    :host { display: block; }
    .ui-select {
      width: 100%;
      border-radius: 10px;
      padding: 0.45rem 0.6rem;
      border: 1px solid var(--border-default, var(--color-border));
      background: var(--content-background-solid, var(--color-background));
      color: var(--color-text-primary);
      appearance: none;
    }

    .ui-select:focus {
      outline: none;
      box-shadow: 0 0 0 3px var(--focus-ring-color, rgba(102,126,234,0.12));
      border-color: var(--color-primary);
    }
  `]
})
export class UiSelectComponent {
    @Input() value: string | number | null = null;
    @Output() valueChange = new EventEmitter<string | number>();
    @Input() disabled: boolean | '' | string = false;

    get disabledState(): boolean {
        if (this.disabled === '') return true;
        if (this.disabled === true) return true;
        if (this.disabled === 'true') return true;
        if (typeof this.disabled === 'string') return this.disabled.length > 0 && this.disabled !== 'false';
        return false;
    }

    onChange(event: Event) {
        const v = (event.target as HTMLSelectElement).value;
        this.value = v;
        this.valueChange.emit(v);
    }
}
