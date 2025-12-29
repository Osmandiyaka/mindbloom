import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'ui-radio',
    standalone: true,
    imports: [CommonModule],
    template: `
    <label class="ui-radio" [class.ui-radio--disabled]="disabledState">
      <input
        type="radio"
        [name]="name || null"
        [value]="value ?? ''"
        [checked]="checked"
        [disabled]="disabledState"
        (change)="onChange($event)"
      />
      <span class="ui-radio__outer">
        <span class="ui-radio__inner"></span>
      </span>
      <span class="ui-radio__label">
        <ng-content></ng-content>{{ label }}
      </span>
    </label>
  `,
    styles: [`
    :host { display: inline-block; }
    .ui-radio {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: var(--color-text-primary);
      user-select: none;
    }

    .ui-radio input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .ui-radio__outer {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1px solid var(--border-default, var(--color-border));
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.12s ease;
      background: var(--content-background-solid, var(--color-background));
    }

    .ui-radio__inner {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: transparent;
      transition: background 0.12s ease, transform 0.12s ease;
      transform: scale(0.5);
    }

    .ui-radio input:focus + .ui-radio__outer {
      box-shadow: 0 0 0 3px var(--focus-ring-color, rgba(102,126,234,0.12));
      border-color: var(--color-primary);
    }

    .ui-radio input:checked + .ui-radio__outer {
      border-color: var(--color-primary);
    }

    .ui-radio input:checked + .ui-radio__outer .ui-radio__inner {
      background: var(--color-primary);
      transform: scale(1);
    }

    .ui-radio--disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .ui-radio__label { font: inherit; }
  `]
})
export class UiRadioComponent {
    @Input() label = '';
    @Input() name = '';
    @Input() value: string | number | null = null;
    @Input() checked = false;
    @Input() disabled: boolean | '' | string = false;

    @Output() change = new EventEmitter<string | number | null>();

    get disabledState(): boolean {
        if (this.disabled === '') return true;
        if (this.disabled === true) return true;
        if (this.disabled === 'true') return true;
        if (typeof this.disabled === 'string') return this.disabled.length > 0 && this.disabled !== 'false';
        return false;
    }

    onChange(event: Event) {
        const input = event.target as HTMLInputElement;
        this.checked = input.checked;
        if (input.checked) {
            this.change.emit(this.value);
        }
    }
}
