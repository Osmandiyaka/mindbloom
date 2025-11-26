import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeesService } from '../../../../core/services/fees.service';

@Component({
  selector: 'app-fee-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="plans-page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Fees</p>
          <h1>Fee Plans</h1>
          <p class="sub">Configure fee plans and amounts.</p>
        </div>
      </header>

      <div class="plans-grid">
        <div class="card plan-card" *ngFor="let plan of fees.plans()">
          <h3>{{ plan.name }}</h3>
          <p class="muted">{{ plan.description }}</p>
          <div class="meta">
            <span class="pill">{{ plan.frequency | titlecase }}</span>
            <span class="amount">\${{ plan.amount }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .plans-page { padding:1.5rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem; }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0; color: var(--color-text-primary); }
    .sub { margin:0.35rem 0 0; color: var(--color-text-secondary); }
    .plans-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:1rem; }
    .plan-card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1.25rem; box-shadow: var(--shadow-sm); }
    h3 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .muted { margin:0; color: var(--color-text-secondary); min-height:2.5rem; }
    .meta { display:flex; justify-content:space-between; align-items:center; margin-top:0.75rem; }
    .pill { padding:0.25rem 0.6rem; border-radius:10px; background: var(--color-surface-hover); color: var(--color-text-primary); font-weight:600; }
    .amount { font-weight:700; color: var(--color-text-primary); }
  `]
})
export class FeePlansComponent {
  constructor(public fees: FeesService) {}
}
