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
          <h1 class="card-title">Fee Structure Designer</h1>
          <p class="sub">Build, preview, and save fee structures per grade and academic year.</p>
        </div>
        <div class="actions">
          <button class="btn ghost" (click)="copyLatest()">Copy From Existing</button>
          <button class="btn primary" (click)="save()">Save Structure</button>
        </div>
      </header>

      <section class="builder">
        <div class="card form-card">
          <div class="card-header">
            <div>
              <p class="eyebrow">Setup</p>
              <h3 class="card-title">Define structure</h3>
            </div>
          </div>
          <div class="form-grid">
            <label>Structure name
              <input [(ngModel)]="form.name" placeholder="e.g., Junior High Standard" />
            </label>
            <label>Academic year
              <input [(ngModel)]="form.academicYear" placeholder="2025" />
            </label>
            <label>Grade
              <select [(ngModel)]="form.grade">
                <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
              </select>
            </label>
            <label>Payment term
              <div class="chip-row">
                <button class="chip" [class.active]="form.paymentTerm==='full'" (click)="form.paymentTerm='full'" type="button">Full</button>
                <button class="chip" [class.active]="form.paymentTerm==='termly'" (click)="form.paymentTerm='termly'" type="button">Termly</button>
                <button class="chip" [class.active]="form.paymentTerm==='monthly'" (click)="form.paymentTerm='monthly'" type="button">Monthly</button>
              </div>
            </label>
          </div>

          <div class="components">
            <div class="row head">
              <span>Component</span>
              <span>Amount</span>
              <span></span>
            </div>
            <div class="row" *ngFor="let comp of form.components; let i = index">
              <input [(ngModel)]="comp.label" placeholder="Label" />
              <input type="number" min="0" [(ngModel)]="comp.amount" />
              <button class="chip ghost" (click)="removeComponent(i)" *ngIf="form.components.length > 1">Remove</button>
            </div>
            <div class="row add-row">
              <button class="btn ghost small" (click)="addComponent()">+ Add component</button>
              <div class="chip-row presets">
                <span class="label">Presets:</span>
                <button class="chip small" (click)="quickAdd('Transport',120)">Transport</button>
                <button class="chip small" (click)="quickAdd('Meals',140)">Meals</button>
                <button class="chip small" (click)="quickAdd('Library',90)">Library</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card preview-card">
          <div class="card-header">
            <div>
              <p class="eyebrow">{{ form.academicYear }} · {{ form.grade }}</p>
              <h3 class="card-title">{{ form.name || 'Untitled structure' }}</h3>
            </div>
            <div class="pill">{{ form.paymentTerm | titlecase }}</div>
          </div>
          <div class="components">
            <div class="row" *ngFor="let comp of form.components">
              <span>{{ comp.label || 'Component' }}</span>
              <span class="amount">{{ comp.amount || 0 | currency:'USD' }}</span>
            </div>
            <div class="row total">
              <span>Total</span>
              <span class="amount">{{ total | currency:'USD' }}</span>
            </div>
          </div>
          <div class="actions">
            <button class="btn ghost small" type="button">Preview Invoice</button>
            <button class="btn ghost small" type="button">Assign to Grade</button>
          </div>
        </div>
      </section>

      <section class="grid">
        <div class="card full-header">
          <div class="card-header">
            <h3 class="card-title">Existing Structures</h3>
            <div class="chip-row">
              <button class="chip small" (click)="filter = ''" [class.active]="!filter">All</button>
              <button class="chip small" *ngFor="let g of grades" (click)="filter=g" [class.active]="filter===g">{{ g }}</button>
            </div>
          </div>
        </div>
        <div class="card structure" *ngFor="let fs of filteredStructures">
          <div class="card-header">
            <div>
              <p class="eyebrow">{{ fs.academicYear }} · {{ fs.grade }}</p>
              <h3 class="card-title">{{ fs.name }}</h3>
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
    .builder { display:grid; grid-template-columns: repeat(auto-fit,minmax(360px,1fr)); gap:1rem; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(300px,1fr)); gap:1rem; }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
    .pill { padding:0.35rem 0.65rem; border-radius:999px; background: var(--color-surface-hover); border:1px solid var(--color-border); color: var(--color-text-secondary); font-weight:700; font-size:0.8rem; }
    .components { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; margin:0.5rem 0; }
    .row { display:flex; justify-content:space-between; align-items:center; gap:0.75rem; padding:0.6rem 0.8rem; border-bottom:1px solid var(--color-border); color: var(--color-text-primary); }
    .row:last-child { border-bottom:none; }
    .row.head { font-weight:700; background: var(--color-surface-hover); }
    .row input { width:100%; border:1px solid var(--color-border); border-radius:8px; padding:0.5rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .total { font-weight:700; background: var(--color-surface-hover); }
    .amount { font-weight:700; }
    .structure .actions { display:flex; gap:0.5rem; margin-top:0.5rem; }
    .empty { text-align:center; }
    .form-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap:0.75rem; margin-bottom:0.75rem; }
    .form-grid input, .form-grid select { width:100%; border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .chip-row { display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center; }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.75rem; border-radius:12px; background: var(--color-surface-hover); cursor:pointer; color: var(--color-text-primary); font-weight:600; }
    .chip.small { padding:0.25rem 0.6rem; font-size:0.85rem; }
    .chip.active { background: color-mix(in srgb, var(--color-primary) 20%, transparent); border-color: color-mix(in srgb, var(--color-primary) 60%, var(--color-border)); color: var(--color-text-primary); }
    .add-row { justify-content:space-between; }
    .presets { flex:1; justify-content:flex-end; }
    .presets .label { color: var(--color-text-secondary); font-size:0.85rem; }
    .full-header { grid-column:1/-1; }
  `]
})
export class FeeStructuresComponent {
  grades = ['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
  filter = '';
  form: FeeStructurePreview = {
    name: 'Primary Tuition',
    academicYear: '2025',
    grade: 'Grade 6',
    paymentTerm: 'termly',
    components: [
      { label: 'Tuition', amount: 0 },
      { label: 'Transport', amount: 0 }
    ],
    total: 0
  };

  get total(): number {
    return this.form.components.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }

  constructor(public accounting: AccountingService) {}

  addComponent() {
    this.form.components = [...this.form.components, { label: '', amount: 0 }];
  }

  removeComponent(index: number) {
    this.form.components = this.form.components.filter((_, i) => i !== index);
  }

  quickAdd(label: string, amount: number) {
    this.form.components = [...this.form.components, { label, amount }];
  }

  copyLatest() {
    const latest = this.accounting.feeStructures()[0];
    if (latest) {
      this.form = {
        ...latest,
        components: latest.components.map(c => ({ ...c })),
        name: `${latest.name} Copy`,
        academicYear: String(Number(latest.academicYear) || latest.academicYear)
      };
    }
  }

  save() {
    const payload: FeeStructurePreview = {
      ...this.form,
      total: this.total
    };
    this.accounting.upsertFeeStructure(payload);
  }

  get filteredStructures(): FeeStructurePreview[] {
    const items = this.accounting.feeStructures();
    if (!this.filter) return items;
    return items.filter(fs => fs.grade === this.filter);
  }
}
