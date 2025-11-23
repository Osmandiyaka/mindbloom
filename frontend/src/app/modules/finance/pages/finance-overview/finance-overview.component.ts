import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../../../shared/components/hero/hero.component';

@Component({
    selector: 'app-finance-overview',
    standalone: true,
    imports: [CommonModule, HeroComponent],
    template: `
    <div>
      <app-hero
        title="Finance & Accounting"
        subtitle="Manage accounts, budgets, expenses, and financial reports"
        image="assets/illustrations/finance.svg"
      />
    </div>
  `
})
export class FinanceOverviewComponent { }
