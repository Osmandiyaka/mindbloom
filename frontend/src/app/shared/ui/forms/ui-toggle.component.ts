import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'ui-toggle',
    standalone: true,
    imports: [CommonModule],
    template: `
    <label class="ui-toggle" [class.ui-toggle--disabled]="disabledState">
      <input
        type="checkbox"
        [checked]="checked"
        [disabled]="disabledState"
        (change)="onChange($event)"
      />
      <span class="ui-toggle__track">
        <span class="ui-toggle__thumb"></span>
      </span>
      <span class="ui-toggle__label">
        <ng-content></ng-content>{{ label }}
      </span>
    </label>
  `,
    styles: [`
    :host { display: inline-block; }
    .ui-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      user-select: none;
      color: var(--color-text-primary);
    }

    .ui-toggle input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .ui-toggle__track {
      width: 42px;
      height: 24px;
      border-radius: 999px;
      background: var(--border-default, var(--color-border));
      position: relative;
      transition: background 0.12s ease;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.08);
    }

    .ui-toggle__thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--content-background-solid, #fff);
      box-shadow: 0 1px 2px rgba(0,0,0,0.15);
      transition: transform 0.14s ease, box-shadow 0.14s ease;
    }

    .ui-toggle input:checked + .ui-toggle__track {
      background: var(--color-primary);
    }

    .ui-toggle input:checked + .ui-toggle__track .ui-toggle__thumb {
      transform: translateX(18px);
      box-shadow: 0 1px 2px rgba(0,0,0,0.18);
    }

    .ui-toggle input:focus + .ui-toggle__track {
      box-shadow: 0 0 0 3px var(--focus-ring-color, rgba(102,126,234,0.12));
    }

    .ui-toggle--disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .ui-toggle__label { font: inherit; }
  `]
})
export class UiToggleComponent {
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
