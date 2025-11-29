import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WalkInService, WalkInRecord } from '../../../../core/services/walkin.service';

@Component({
  selector: 'app-walk-in-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="page-shell">
      <header class="page-header">
        <div>
          <p class="eyebrow">Admissions · Walk-in</p>
          <h2>Walk-in Admissions</h2>
          <p class="muted">Recent walk-in intakes with quick actions.</p>
        </div>
      </header>

      <div class="card" *ngIf="records().length; else empty">
        <div class="table-head">
          <div>Name</div><div>Grade</div><div>Class</div><div>Payment</div><div>Date</div><div class="actions-col">Actions</div>
        </div>
        <div class="table-row" *ngFor="let rec of records()">
          <div class="strong">{{ rec.basic.name }}<div class="muted small">{{ rec.basic.parentName }}</div></div>
          <div>{{ rec.basic.grade }}</div>
          <div>{{ rec.assignment.className }} · {{ rec.assignment.section }}</div>
          <div>₦{{ rec.payment.amount }} · {{ rec.payment.mode | titlecase }}</div>
          <div>{{ rec.submittedAt | date:'mediumDate' }}</div>
          <div class="actions">
            <a class="btn tiny ghost" [routerLink]="['/admissions/walk-in/receipt', rec.id]">Receipt</a>
          </div>
        </div>
      </div>
      <ng-template #empty>
        <div class="empty">No walk-in records yet.</div>
      </ng-template>
    </section>
  `,
  styles: [`
    .page-shell{padding:1rem 1.5rem; display:flex; flex-direction:column; gap:1rem;}
    .page-header{display:flex; justify-content:space-between; align-items:flex-start;}
    .eyebrow{text-transform:uppercase; letter-spacing:0.08em; margin:0; font-size:12px; color:var(--color-text-secondary);} 
    h2{margin:0.1rem 0;}
    .muted{color:var(--color-text-secondary); margin:0;}
    .muted.small{font-size:0.9rem;}
    .card{border:1px solid var(--color-border); border-radius:12px; overflow:hidden; background:var(--color-surface);} 
    .table-head,.table-row{display:grid; grid-template-columns:1.6fr 0.8fr 1fr 1fr 1fr 1fr; gap:0.6rem; padding:0.75rem 1rem; align-items:center;}
    .table-head{background:var(--color-surface-hover); font-weight:700;}
    .table-row{border-top:1px solid var(--color-border);} 
    .strong{font-weight:700; color:var(--color-text-primary);} 
    .actions{display:flex; gap:0.35rem; justify-content:flex-end;}
    .btn{border:1px solid var(--color-border); border-radius:8px; padding:0.35rem 0.7rem; text-decoration:none; color:inherit;}
    .btn.tiny{font-size:0.85rem;}
    .btn.ghost{background:transparent;}
    .empty{padding:1rem; border:1px dashed var(--color-border); border-radius:12px; text-align:center; color:var(--color-text-secondary);} 
    .actions-col{text-align:right;}
  `]
})
export class WalkInListComponent {
  records = computed(() => this.walkIns.records());
  constructor(private readonly walkIns: WalkInService) {}
}
