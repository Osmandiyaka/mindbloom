import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject } from '@angular/core';
import { TenantService } from '../../../core/services/tenant.service';

@Component({
  selector: 'app-currency',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="currency" [class.muted]="muted" [class.strong]="strong">{{ formatted() }}</span>
  `,
  styles: [`
    .currency {
      display: inline-block;
      text-align: right;
      min-width: 5.5ch;
      font-variant-numeric: tabular-nums;
      color: var(--color-text-primary);
    }
    .currency.muted { color: var(--color-text-secondary); }
    .currency.strong { font-weight: 700; }
  `]
})
export class CurrencyDisplayComponent {
  private tenant = inject(TenantService);

  @Input() amount: number | null | undefined = 0;
  @Input() currency?: string;
  @Input() locale?: string;
  @Input() muted = false;
  @Input() strong = false;

  formatted = computed(() => {
    const tenant = this.tenant.currentTenant();
    const code = this.currency || tenant?.currency || 'USD';
    const loc = this.locale || tenant?.locale || 'en-US';
    const value = Number(this.amount ?? 0);
    try {
      return new Intl.NumberFormat(loc, {
        style: 'currency',
        currency: code,
        currencyDisplay: 'symbol',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return value.toFixed(2);
    }
  });
}
