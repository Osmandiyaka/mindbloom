import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AccountingService, FeeCandidate, FeeStructurePreview } from '../../../../core/services/accounting.service';
import { CurrencyDisplayComponent } from '../../../../shared/components/currency-display/currency-display.component';

@Component({
  selector: 'app-fee-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CurrencyDisplayComponent],
  template: `
    <div class="page">
      <nav class="breadcrumbs">
        <a routerLink="/accounting">Accounting</a>
        <span class="sep">/</span>
        <span>Fee Assignment</span>
      </nav>
      <header class="page-header">
        <div>
          <p class="eyebrow">Accounting · Fees</p>
          <h1 class="card-title">Student Fee Assignment</h1>
          <p class="sub">Bulk assign fee structures, payment plans, and discounts per student or grade.</p>
        </div>
        <div class="actions">
          <button class="btn ghost" (click)="reset()">Reset</button>
          <select class="mini-select" [(ngModel)]="assignGrade">
            <option value="">Select grade</option>
            <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
          </select>
          <button class="btn ghost" (click)="assignToGrade()">Assign to Grade</button>
          <button class="btn ghost" (click)="openStructurePreview()">Preview Structure</button>
          <button class="btn primary" (click)="applyToSelected()">Apply to Selected</button>
        </div>
      </header>

      <section class="card filters">
        <div class="card-header">
          <h3 class="card-title">Filters</h3>
        </div>
        <div class="filter-grid">
          <label>Search
            <input type="search" [(ngModel)]="search" placeholder="Search by name or admission #" />
          </label>
          <label>Grade
            <select [(ngModel)]="gradeFilter">
              <option value="">All grades</option>
              <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
            </select>
          </label>
          <label>Structure
            <select [(ngModel)]="structureFilter">
              <option value="">All structures</option>
              <option *ngFor="let s of structureNames" [value]="s">{{ s }}</option>
            </select>
          </label>
          <label>Plan
            <select [(ngModel)]="planFilter">
              <option value="">All</option>
              <option value="full">Full</option>
              <option value="termly">Termly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        </div>
      </section>

      <section class="card assigner">
        <div class="assign-grid">
          <label>Fee structure
            <select [(ngModel)]="selectedStructure">
              <option *ngFor="let s of structureNames" [value]="s">{{ s }}</option>
            </select>
          </label>
          <label>Payment plan
            <div class="chip-row">
              <button class="chip" [class.active]="plan==='full'" (click)="plan='full'" type="button">Full</button>
              <button class="chip" [class.active]="plan==='termly'" (click)="plan='termly'" type="button">Termly</button>
              <button class="chip" [class.active]="plan==='monthly'" (click)="plan='monthly'" type="button">Monthly</button>
            </div>
          </label>
          <label>Discount %
            <input type="number" min="0" max="100" [(ngModel)]="discount" placeholder="0-100" />
          </label>
          <label>Scholarship note
            <input [(ngModel)]="scholarship" placeholder="Optional note" />
          </label>
        </div>
      </section>

      <section class="card table">
        <div class="table-head">
          <span><input type="checkbox" [(ngModel)]="selectAll" (change)="toggleAll()" /></span>
          <span>Student</span>
          <span>Grade</span>
          <span>Admission</span>
          <span>Structure</span>
          <span>Plan</span>
          <span>Discount</span>
          <span>Total</span>
          <span></span>
        </div>
        <div class="table-row" *ngFor="let c of filtered">
          <span><input type="checkbox" [(ngModel)]="c.selected" /></span>
          <div class="student-cell">
            <span class="avatar small">{{ initials(c.name) }}</span>
            <div class="student-meta">
              <span class="strong">{{ c.name }}</span>
              <span class="muted">{{ c.scholarship || 'No scholarship' }}</span>
            </div>
          </div>
          <span>{{ c.grade }}</span>
          <span>{{ c.admissionNo }}</span>
          <span>{{ c.structure || 'Unassigned' }}</span>
          <span class="pill sm">{{ (c.plan || '—') | titlecase }}</span>
          <span>
            <input type="number" min="0" max="100" [(ngModel)]="c.discountPct" (input)="recalc(c)" />
          </span>
          <span class="amount">
            <app-currency [amount]="displayTotal(c)"></app-currency>
          </span>
          <span><button class="chip ghost small" (click)="previewOne(c)">Preview</button></span>
        </div>
        <div class="table-row" *ngIf="!filtered.length">
          <span class="muted" style="grid-column:1/10">No students found.</span>
        </div>
      </section>

      @if (previewing) {
        <div class="modal-backdrop" (click)="closePreview()"></div>
        <div class="modal">
          <div class="modal-header">
            <div>
              <p class="eyebrow">{{ previewing.grade }} · {{ previewing.admissionNo }}</p>
              <h3 class="card-title">Fee Preview · {{ previewing.name }}</h3>
            </div>
            <button class="chip ghost" (click)="closePreview()">✕</button>
          </div>
          <div class="preview-body">
            <div class="row head"><span>Item</span><span>Amount</span></div>
            <div class="row" *ngFor="let comp of previewStructure?.components || []">
              <span>{{ comp.label }}</span>
              <span class="amount">{{ comp.amount | currency:'USD' }}</span>
            </div>
            <div class="row total">
              <span>Subtotal</span>
              <span class="amount">{{ previewStructure?.total || 0 | currency:'USD' }}</span>
            </div>
            <div class="row" *ngIf="previewing.discountPct">
              <span>Discount ({{ previewing.discountPct }}%)</span>
              <span class="amount">-{{ discountValue(previewing) | currency:'USD' }}</span>
            </div>
            <div class="row total">
              <span>Net Total</span>
              <span class="amount">{{ displayTotal(previewing) | currency:'USD' }}</span>
            </div>
            <p class="sub">Plan: {{ (previewing.plan || 'termly') | titlecase }}</p>
          </div>
          <div class="modal-actions">
            <button class="btn primary" (click)="closePreview()">Close</button>
          </div>
        </div>
      }

      @if (structurePreview) {
        <div class="modal-backdrop" (click)="closeStructurePreview()"></div>
        <div class="modal">
          <div class="modal-header">
            <div>
              <p class="eyebrow">{{ structurePreview.academicYear }} · {{ structurePreview.grade }}</p>
              <h3 class="card-title">Structure Preview · {{ structurePreview.name }}</h3>
            </div>
            <button class="chip ghost" (click)="closeStructurePreview()">✕</button>
          </div>
          <div class="preview-body">
            <div class="row head"><span>Item</span><span>Amount</span></div>
            <div class="row" *ngFor="let comp of structurePreview.components">
              <span>{{ comp.label }}</span>
              <span class="amount">{{ comp.amount | currency:'USD' }}</span>
            </div>
            <div class="row total">
              <span>Total</span>
              <span class="amount">{{ structurePreview.total | currency:'USD' }}</span>
            </div>
            <p class="sub">Default plan: {{ structurePreview.paymentTerm | titlecase }}</p>
          </div>
          <div class="modal-actions">
            <button class="btn primary" (click)="closeStructurePreview()">Close</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .actions { display:flex; gap:0.5rem; }
    .mini-select { padding:0.45rem 0.6rem; border-radius:8px; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .btn.ghost { background: transparent; }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
    .filters input, .filters select { width:100%; border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .filter-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap:0.75rem; }
    .assigner { display:flex; flex-direction:column; gap:0.75rem; }
    .assign-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap:0.75rem; }
    .assigner input, .assigner select { width:100%; border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .chip-row { display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center; }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.75rem; border-radius:12px; background: var(--color-surface-hover); cursor:pointer; color: var(--color-text-primary); font-weight:600; }
    .chip.small { padding:0.25rem 0.6rem; font-size:0.85rem; }
    .chip.active { background: color-mix(in srgb, var(--color-primary) 20%, transparent); border-color: color-mix(in srgb, var(--color-primary) 60%, var(--color-border)); color: var(--color-text-primary); }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; background: var(--color-surface); }
    .table-head, .table-row { display:grid; grid-template-columns: 0.6fr 2fr 1fr 1.2fr 1.2fr 1fr 1fr 1.2fr 1fr; gap:0.5rem; padding:0.6rem 0.8rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .student-cell { display:flex; gap:0.65rem; align-items:center; }
    .student-meta { display:flex; flex-direction:column; gap:0.15rem; }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .muted { color: var(--color-text-secondary); font-size:0.85rem; }
    .avatar.small { width:36px; height:36px; border-radius:10px; background: var(--color-surface-hover); display:flex; align-items:center; justify-content:center; font-weight:700; color: var(--color-text-primary); }
    .pill.sm { padding:0.2rem 0.6rem; border-radius:10px; background: var(--color-surface-hover); border:1px solid var(--color-border); font-weight:700; font-size:0.8rem; text-align:center; }
    .amount { font-weight:700; color: var(--color-text-primary); }
    .table input[type="number"] { width:100%; border:1px solid var(--color-border); border-radius:8px; padding:0.4rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:20; }
    .modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width: min(640px, 92vw); background: var(--color-surface); border:1px solid var(--color-border); border-radius:14px; padding:1rem; box-shadow: var(--shadow-lg, 0 20px 50px rgba(0,0,0,0.25)); z-index:21; display:flex; flex-direction:column; gap:0.75rem; }
    .modal-header { display:flex; justify-content:space-between; align-items:center; }
    .preview-body { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; }
    .row { display:flex; justify-content:space-between; align-items:center; gap:0.75rem; padding:0.6rem 0.8rem; border-bottom:1px solid var(--color-border); color: var(--color-text-primary); }
    .row.head { font-weight:700; background: var(--color-surface-hover); }
    .row.total { font-weight:700; background: var(--color-surface-hover); }
    .modal-actions { display:flex; justify-content:flex-end; gap:0.5rem; }
    .breadcrumbs { display:flex; align-items:center; gap:0.35rem; color: var(--color-text-secondary); font-size:0.9rem; margin-bottom:0.25rem; }
    .breadcrumbs a { color: var(--color-primary); text-decoration:none; }
    .breadcrumbs .sep { color: var(--color-text-secondary); }
  `]
})
export class FeeAssignmentComponent {
  search = '';
  gradeFilter = '';
  structureFilter = '';
  planFilter = '';
  selectedStructure = '';
  plan: 'full' | 'termly' | 'monthly' = 'termly';
  discount = 0;
  scholarship = '';
  selectAll = false;
  assignGrade = '';

  previewing: FeeCandidate | null = null;
  previewStructure: FeeStructurePreview | null = null;
  structurePreview: FeeStructurePreview | null = null;

  grades = ['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];

  constructor(public accounting: AccountingService) {
    const firstStructure = this.structureNames[0];
    this.selectedStructure = firstStructure || '';
  }

  get structureNames(): string[] {
    return this.accounting.feeStructures().map(fs => fs.name);
  }

  get filtered(): FeeCandidate[] {
    return this.accounting.feeCandidates().filter(c => {
      const matchSearch = !this.search || c.name.toLowerCase().includes(this.search.toLowerCase()) || c.admissionNo.toLowerCase().includes(this.search.toLowerCase());
      const matchGrade = !this.gradeFilter || c.grade === this.gradeFilter;
      const matchStructure = !this.structureFilter || c.structure === this.structureFilter;
      const matchPlan = !this.planFilter || c.plan === this.planFilter;
      return matchSearch && matchGrade && matchStructure && matchPlan;
    });
  }

  reset() {
    this.search = '';
    this.gradeFilter = '';
    this.structureFilter = '';
    this.planFilter = '';
    this.discount = 0;
    this.scholarship = '';
    this.selectAll = false;
    this.accounting.feeCandidates.set(this.accounting.feeCandidates().map(c => ({ ...c, selected: false, discountPct: c.discountPct, customTotal: undefined })));
  }

  toggleAll() {
    const val = this.selectAll;
    this.accounting.feeCandidates.set(this.accounting.feeCandidates().map(c => ({ ...c, selected: val })));
  }

  applyToSelected() {
    const ids = this.accounting.feeCandidates().filter(c => c.selected).map(c => c.id);
    if (!ids.length) return;
    this.accounting.assignFeePlan(ids, this.plan, this.selectedStructure, this.discount);
  }

  assignToGrade() {
    const grade = this.assignGrade || this.gradeFilter || this.grades[0];
    if (!grade) return;
    const targets = this.accounting.feeCandidates().filter(c => c.grade === grade).map(c => c.id);
    if (!targets.length) return;
    this.accounting.assignFeePlan(targets, this.plan, this.selectedStructure, this.discount);
    // mark them selected for visibility
    this.accounting.feeCandidates.set(this.accounting.feeCandidates().map(c => targets.includes(c.id) ? { ...c, selected: true } : c));
  }

  displayTotal(c: FeeCandidate): number {
    if (c.customTotal != null) return c.customTotal;
    return this.accounting.calcDiscountedTotal(c.baseTotal, c.discountPct);
  }

  recalc(c: FeeCandidate) {
    const total = this.accounting.calcDiscountedTotal(c.baseTotal, c.discountPct);
    c.customTotal = total;
  }

  previewOne(c: FeeCandidate) {
    this.previewing = c;
    this.previewStructure = this.accounting.feeStructures().find(fs => fs.name === (c.structure || this.selectedStructure)) || null;
  }

  closePreview() {
    this.previewing = null;
    this.previewStructure = null;
  }

  discountValue(c: FeeCandidate): number {
    if (!c.discountPct) return 0;
    return +(c.baseTotal * (c.discountPct / 100)).toFixed(2);
  }

  openStructurePreview() {
    this.structurePreview = this.accounting.feeStructures().find(fs => fs.name === this.selectedStructure) || null;
  }

  closeStructurePreview() {
    this.structurePreview = null;
  }

  initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  }
}
