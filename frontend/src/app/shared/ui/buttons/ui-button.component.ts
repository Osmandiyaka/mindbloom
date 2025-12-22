import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [attr.type]="type"
      [disabled]="disabledState"
      [class]="classes">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host { display: inline-block; }
    button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border-radius: var(--btn-radius, 10px);
      padding: var(--btn-padding-md, 0.6rem 1rem);
      border: 1px solid var(--btn-border, var(--color-text-primary));
      background: var(--btn-bg, var(--color-surface));
      color: var(--btn-text, var(--color-text-primary));
      cursor: pointer;
      font-weight: 700;
      transition: all 0.12s ease;
    }

    button:hover { background: var(--btn-bg-hover, var(--color-surface-hover)); }

    button.btn-sm { padding: var(--btn-padding-sm, 0.45rem 0.65rem); }
    button.btn-lg { padding: var(--btn-padding-lg, 0.75rem 1.25rem); }

    button.btn-primary {
      background: linear-gradient(180deg, var(--btn-primary-bg, var(--color-primary)) 0%, color-mix(in srgb, var(--btn-primary-bg, var(--color-primary)) 88%, #000 12%) 100%);
      color: var(--btn-primary-text, #fff);
      border-color: var(--btn-primary-border, var(--color-primary));
      box-shadow: var(--host-primary-glow, rgba(0,0,0,0.04));
    }

    button.btn-danger {
      background: var(--btn-danger-bg, transparent);
      border-color: var(--btn-danger-border, var(--color-error, #ef4444));
      color: var(--btn-danger-text, var(--color-error, #ef4444));
      font-weight: 700;
      box-shadow: none;
    }

    button.btn-ghost {
      background: var(--btn-ghost-bg, #fff);
      border-color: var(--btn-ghost-border, var(--color-text-primary));
      color: var(--btn-ghost-text, var(--color-text-primary));
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    button:focus {
      outline: none;
      box-shadow: 0 0 0 3px var(--focus-ring-color, rgba(102,126,234,0.22));
    }
  `]
})
export class UiButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled: boolean | '' | string = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  get classes(): string {
    const cls = ['btn'];
    if (this.variant === 'primary') cls.push('btn-primary');
    if (this.variant === 'ghost') cls.push('btn-ghost');
    if (this.variant === 'danger') cls.push('btn-danger');
    if (this.size === 'sm') cls.push('btn-sm');
    if (this.size === 'lg') cls.push('btn-lg');
    return cls.join(' ');
  }

  get disabledState(): boolean {
    if (this.disabled === '') return true;
    if (this.disabled === true) return true;
    if (this.disabled === 'true') return true;
    if (typeof this.disabled === 'string') return this.disabled.length > 0 && this.disabled !== 'false';
    return false;
  }
}
