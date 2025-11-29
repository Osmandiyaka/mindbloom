import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WalkInService, WalkInRecord } from '../../../../core/services/walkin.service';

@Component({
  selector: 'app-walk-in-receipt',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell" *ngIf="record; else missing">
      <header class="page-header">
        <div>
          <p class="eyebrow">Walk-in Receipt</p>
          <h2>{{ record.basic.name }}</h2>
          <p class="muted">Grade {{ record.basic.grade }} · {{ record.basic.parentName }} · {{ record.basic.parentContact }}</p>
        </div>
        <button class="btn" (click)="print()">Print</button>
      </header>

      <div class="card">
        <div class="row"><strong>Class:</strong> {{ record.assignment.className }} · {{ record.assignment.section }}</div>
        <div class="row"><strong>Payment:</strong> ₦{{ record.payment.amount }} via {{ record.payment.mode | titlecase }}</div>
        <div class="row"><strong>Plan:</strong> {{ record.payment.plan }}</div>
        <div class="row"><strong>Date:</strong> {{ record.submittedAt | date:'medium' }}</div>
        <div class="row"><strong>Reference:</strong> {{ record.payment.reference || 'N/A' }}</div>
      </div>
    </section>
    <ng-template #missing>
      <div class="page-shell"><p class="muted">Receipt not found.</p></div>
    </ng-template>
  `,
  styles: [`
    .page-shell{padding:1rem 1.5rem; display:flex; flex-direction:column; gap:1rem;}
    .page-header{display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;}
    .eyebrow{text-transform:uppercase; letter-spacing:0.08em; margin:0; font-size:12px; color:var(--color-text-secondary);} 
    h2{margin:0.1rem 0;}
    .muted{color:var(--color-text-secondary); margin:0;}
    .card{border:1px solid var(--color-border); border-radius:12px; padding:1rem; background:var(--color-surface);} 
    .row{padding:0.35rem 0;}
    .btn{border:1px solid var(--color-border); border-radius:10px; padding:0.65rem 1rem; background:var(--color-surface-hover); color:inherit; cursor:pointer;}
  `]
})
export class WalkInReceiptComponent {
  record?: WalkInRecord;
  constructor(route: ActivatedRoute, walkIns: WalkInService) {
    const id = route.snapshot.paramMap.get('id') || '';
    this.record = walkIns.getById(id);
  }

  print() {
    window.print();
  }
}
