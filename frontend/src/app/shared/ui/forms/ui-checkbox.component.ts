import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'ui-checkbox',
    standalone: true,
    imports: [CommonModule],
    template: `
    <label class="ui-checkbox" [class.ui-checkbox--disabled]="disabledState">
      <input
        type="checkbox"
        [checked]="checked"
        [disabled]="disabledState"
        (change)="onChange($event)"
      />
      <span class="ui-checkbox__box"></span>
      <span class="ui-checkbox__label">
        <ng-content></ng-content>{{ label }}
      </span>
    </label>
  `,
    styles: [`
    :host { display: inline-block; }
    .ui-checkbox {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: var(--color-text-primary);
      user-select: none;
    }

    .ui-checkbox input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .ui-checkbox__box {
      width: 18px;
      height: 18px;
      border-radius: 6px;
      border: 1px solid var(--border-default, var(--color-border));
      background: var(--content-background-solid, var(--color-background));
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.12s ease;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);
    }

    .ui-checkbox input:focus + .ui-checkbox__box {
      box-shadow: 0 0 0 3px var(--focus-ring-color, rgba(102,126,234,0.12));
      border-color: var(--color-primary);
    }

    .ui-checkbox input:checked + .ui-checkbox__box {
      background: var(--color-primary);
      border-color: var(--color-primary);
    }

    .ui-checkbox input:checked + .ui-checkbox__box::after {
      content: '';
      width: 10px;
      height: 10px;
      display: block;
      border-radius: 4px;
      background: var(--color-on-primary, #fff);
    }

    .ui-checkbox--disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .ui-checkbox__label { font: inherit; }
  `]
})
export class UiCheckboxComponent {
    @Input() label = '';
    @Input() checked = false;
    @Output() checkedChange = new EventEmitter<boolean>();
    @Input() disabled: boolean | '' | string = false;

    get disabledState(): boolean {
        if (this.disabled === '') return true;
        if (this.disabled === true) return true;
        if (this.disabled === 'true') return true;
        if (typeof this.disabled === 'string') return this.disabled.length > 0 && this.disabled !== 'false';
        return false;
    }

    onChange(event: Event) {
        const checked = (event.target as HTMLInputElement).checked;
        this.checked = checked;
        this.checkedChange.emit(checked);
    }
}
