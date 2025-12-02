import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef, computed, inject } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TenantService } from '../../../core/services/tenant.service';

@Component({
  selector: 'app-amount-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AmountInputComponent),
      multi: true,
    },
  ],
  template: `
    <label class="amount-wrapper">
      <span class="symbol">{{ symbol() }}</span>
      <input
        type="number"
        [attr.placeholder]="placeholder"
        [disabled]="disabled"
        [value]="_value ?? ''"
        (input)="handleInput($event)"
        (blur)="markTouched()"
        step="0.01"
      />
    </label>
  `,
  styles: [`
    .amount-wrapper {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--color-surface-hover);
      border: 1.5px solid color-mix(in srgb, var(--color-primary) 60%, var(--color-border) 40%);
      border-radius: 14px;
      padding: 0.35rem 0.5rem;
      color: var(--color-text-primary);
      box-shadow: 0 6px 14px rgba(0,0,0,0.10);
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      width: 100%;
      box-sizing: border-box;
    }
    .amount-wrapper:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 8px 18px rgba(0,0,0,0.14), 0 0 0 3px color-mix(in srgb, var(--color-primary) 24%, transparent);
      background: color-mix(in srgb, var(--color-surface-hover) 88%, var(--color-primary) 12%);
    }
    .symbol {
      font-weight: 700;
      color: var(--color-primary);
      min-width: 1.5ch;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      color: var(--color-text-primary);
      text-align: right;
      font-variant-numeric: tabular-nums;
      padding: 0.2rem 0.25rem;
      box-shadow: none;
      width: 100%;
      box-sizing: border-box;
    }
    input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class AmountInputComponent implements ControlValueAccessor {
  private tenant = inject(TenantService);

  @Input() currency?: string;
  @Input() locale?: string;
  @Input() placeholder = '0.00';

  disabled = false;
  _value: number | null = null;

  private onChange: (val: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  symbol = computed(() => {
    const tenant = this.tenant.currentTenant();
    const code = this.currency || tenant?.currency || 'USD';
    const loc = this.locale || tenant?.locale || 'en-US';
    try {
      return (new Intl.NumberFormat(loc, { style: 'currency', currency: code }))
        .formatToParts(0)
        .find(p => p.type === 'currency')?.value || '$';
    } catch {
      return '$';
    }
  });

  currencyCode = computed(() => {
    const tenant = this.tenant.currentTenant();
    return (this.currency || tenant?.currency || 'USD').toUpperCase();
  });

  writeValue(value: number | null): void {
    this._value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const parsed = input.value === '' ? null : Number(input.value);
    this._value = parsed === null || isNaN(parsed) ? null : parsed;
    this.onChange(this._value);
  }

  markTouched(): void {
    this.onTouched();
  }
}
