import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HrService } from '../../../../core/services/hr.service';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">HR</p>
          <h1>Leave Management</h1>
          <p class="sub">Track leave types and requests.</p>
        </div>
      </header>

      <section class="card">
        <h3>Create Leave Type</h3>
        <form class="form-grid" (ngSubmit)="addType()">
          <label>Name
            <input [(ngModel)]="typeForm.name" name="name" required />
          </label>
          <label>Code
            <input [(ngModel)]="typeForm.code" name="code" required />
          </label>
          <label>Days/Year
            <input type="number" min="0" [(ngModel)]="typeForm.daysPerYear" name="daysPerYear" required />
          </label>
          <label>
            <input type="checkbox" [(ngModel)]="typeForm.carryForward" name="carryForward" /> Carry forward
          </label>
          <div class="actions">
            <button class="btn primary" type="submit">Save</button>
          </div>
        </form>
      </section>

      <section class="card">
        <div class="card-header">
          <h3>Leave Types</h3>
        </div>
        <div class="table">
          <div class="table-head">
            <span>Name</span><span>Code</span><span>Days</span><span>Carry</span>
          </div>
          <div class="table-row" *ngFor="let t of hr.leaveTypes()">
            <span class="strong">{{ t.name }}</span>
            <span>{{ t.code }}</span>
            <span>{{ t.daysPerYear }}</span>
            <span>{{ t.carryForward ? 'Yes' : 'No' }}</span>
          </div>
          <div class="table-row" *ngIf="!hr.leaveTypes().length">
            <span class="muted" style="grid-column:1/4">No leave types.</span>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <h3>Leave Requests</h3>
        </div>
        <div class="table">
          <div class="table-head">
            <span>Staff</span><span>Type</span><span>Dates</span><span>Status</span><span>Action</span>
          </div>
          <div class="table-row" *ngFor="let r of hr.leaveRequests()">
            <span class="strong">{{ resolveStaff(r.staffId) }}</span>
            <span>{{ r.leaveTypeCode }}</span>
            <span>{{ r.startDate | date:'mediumDate' }} - {{ r.endDate | date:'mediumDate' }}</span>
            <span><span class="pill">{{ r.status }}</span></span>
            <span class="actions-cell">
              <button class="chip" *ngIf="r.status === 'pending'" (click)="approve(r)">Approve</button>
              <button class="chip danger" *ngIf="r.status === 'pending'" (click)="reject(r)">Reject</button>
            </span>
          </div>
          <div class="table-row" *ngIf="!hr.leaveRequests().length">
            <span class="muted" style="grid-column:1/4">No leave requests.</span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
    .form-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; align-items:end; }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    input { border:1px solid var(--color-border); border-radius:8px; padding:0.55rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .actions { display:flex; gap:0.5rem; align-items:center; grid-column:1/-1; }
    .btn { border-radius:10px; padding:0.6rem 1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); cursor:pointer; }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; margin-top:0.25rem; }
    .table-head, .table-row { display:grid; grid-template-columns: 1.5fr 1fr 1.4fr 1fr 1fr; gap:0.5rem; padding:0.8rem 0.9rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .pill { padding:0.25rem 0.6rem; border-radius:10px; background: var(--color-surface-hover); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .muted { color: var(--color-text-secondary); }
    .actions-cell { display:flex; gap:0.35rem; }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.7rem; border-radius:10px; background: var(--color-surface-hover); cursor:pointer; }
    .chip.danger { border-color: rgba(var(--color-error-rgb,239,68,68),0.3); color: var(--color-error,#ef4444); }
  `]
})
export class LeaveComponent implements OnInit {
  typeForm = { name: '', code: '', daysPerYear: 0, carryForward: false };

  constructor(public hr: HrService) {}

  ngOnInit(): void {
    this.hr.loadLeaveRequests();
  }

  addType() {
    if (!this.typeForm.name || !this.typeForm.code) return;
    this.hr.createLeaveType(this.typeForm);
    this.typeForm = { name: '', code: '', daysPerYear: 0, carryForward: false };
  }

  resolveStaff(id: string) {
    const s = this.hr.staff().find(st => st.id === id || st._id === id);
    return s ? (s.fullName || `${s.firstName} ${s.lastName}`) : id;
  }

  approve(req: any) { this.hr.approveLeave(req.id || req._id, 'Manager'); }
  reject(req: any) { this.hr.rejectLeave(req.id || req._id, 'Manager'); }
}
