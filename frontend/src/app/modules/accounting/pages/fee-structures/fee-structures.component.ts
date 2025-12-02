import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountingService, FeeStructurePreview } from '../../../../core/services/accounting.service';

@Component({
  selector: 'app-fee-structures',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Accounting · Fees</p>
          <h1>Fee Structure Designer</h1>
          <p class="sub">Preview fee components by grade and academic year.</p>
        </div>
        <div class="actions">
          <button class="btn primary">Create Structure</button>
          <button class="btn ghost">Copy From Previous Year</button>
        </div>
      </header>

      <section class="grid">
        <div class="card structure" *ngFor="let fs of accounting.feeStructures()">
          <div class="card-header">
            <div>
              <p class="eyebrow">{{ fs.academicYear }} · {{ fs.grade }}</p>
              <h3>{{ fs.name }}</h3>
            </div>
            <div class="pill">{{ fs.paymentTerm | titlecase }}</div>
          </div>
          <div class="components">
            <div class="row" *ngFor="let comp of fs.components">
              <span>{{ comp.label }}</span>
              <span class="amount">{{ comp.amount | currency:'USD' }}</span>
            </div>
            <div class="row total">
              <span>Total</span>
              <span class="amount">{{ fs.total | currency:'USD' }}</span>
            </div>
          </div>
          <div class="actions">
            <button class="btn ghost small">Preview Invoice</button>
            <button class="btn ghost small">Assign to Grade</button>
          </div>
        </div>

        <div class="card empty" *ngIf="!accounting.feeStructures().length">
          <p>No fee structures yet.</p>
          <button class="btn primary">Create Structure</button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .actions { display:flex; gap:0.5rem; }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .btn.ghost { background: transparent; }
    .btn.small { padding:0.45rem 0.8rem; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(300px,1fr)); gap:1rem; }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
    .pill { padding:0.35rem 0.65rem; border-radius:999px; background: var(--color-surface-hover); border:1px solid var(--color-border); color: var(--color-text-secondary); font-weight:700; font-size:0.8rem; }
    .components { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; margin:0.5rem 0; }
    .row { display:flex; justify-content:space-between; padding:0.6rem 0.8rem; border-bottom:1px solid var(--color-border); color: var(--color-text-primary); }
    .row:last-child { border-bottom:none; }
    .total { font-weight:700; background: var(--color-surface-hover); }
    .amount { font-weight:700; }
    .structure .actions { display:flex; gap:0.5rem; margin-top:0.5rem; }
    .empty { text-align:center; }
  `]
})
export class FeeStructuresComponent {
  constructor(public accounting: AccountingService) {}
}
