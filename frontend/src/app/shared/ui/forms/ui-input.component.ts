import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'ui-input',
    standalone: true,
    imports: [CommonModule],
    template: `
    <input
      class="ui-input"
      [attr.type]="type"
      [placeholder]="placeholder"
      [disabled]="disabledState"
      [value]="value"
      (input)="onInput($event)"
    />
  `,
    styles: [`
    :host { display: block; }
    .ui-input {
      width: 100%;
      border-radius: 10px;
      --ui-input-padding-y: 0.55rem;
      --ui-input-padding-x: 0.65rem;
      padding: var(--ui-input-padding, var(--ui-input-padding-y) var(--ui-input-padding-x));
      padding-left: var(--ui-input-padding-left, var(--ui-input-padding-x));
      padding-right: var(--ui-input-padding-right, var(--ui-input-padding-x));
      border: 1px solid var(--border-default, var(--color-border));
      background: var(--content-background-solid, var(--color-background));
      color: var(--color-text-primary);
      transition: box-shadow 0.12s ease, border-color 0.12s ease;
      font: inherit;
    }

    .ui-input:focus {
      outline: none;
      box-shadow: 0 0 0 3px var(--focus-ring-color, rgba(102,126,234,0.12));
      border-color: var(--color-primary);
    }

    .ui-input:disabled { opacity: 0.7; }
  `]
})
export class UiInputComponent {
    @Input() value = '';
    @Output() valueChange = new EventEmitter<string>();

    @Input() placeholder = '';
    @Input() disabled: boolean | '' | string = false;
    @Input() type: 'text' | 'number' | 'password' | 'email' = 'text';

    get disabledState(): boolean {
        if (this.disabled === '') return true;
        if (this.disabled === true) return true;
        if (this.disabled === 'true') return true;
        if (typeof this.disabled === 'string') return this.disabled.length > 0 && this.disabled !== 'false';
        return false;
    }

    onInput(event: Event) {
        const v = (event.target as HTMLInputElement).value;
        this.value = v;
        this.valueChange.emit(v);
    }
}
