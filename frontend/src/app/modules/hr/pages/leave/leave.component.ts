import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HrService, LeaveRequest, LeaveType } from '../../../../core/services/hr.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';

type ToastType = 'success' | 'error' | 'info';
interface Toast { type: ToastType; message: string; }
interface Balance { code: string; name: string; available: number; used: number; }

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ButtonComponent, CardComponent],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">HR</p>
          <h1>Leave Management</h1>
          <p class="sub">Configure leave types, submit requests, and handle approvals.</p>
        </div>
      </header>

      <div class="toast" *ngIf="toast() as t" [class.success]="t.type==='success'" [class.error]="t.type==='error'">{{ t.message }}</div>

      <div class="grid">
        <app-card class="panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow small">Balances</p>
              <h3>Your leave</h3>
            </div>
          </div>
          <div class="balances">
            <div class="balance-card" *ngFor="let b of balances()">
              <div class="row">
                <span class="strong">{{ b.name }}</span>
                <span class="pill">{{ b.available - b.used }} remaining</span>
              </div>
              <div class="progress">
                <div class="bar" [style.width.%]="(b.used / (b.available || 1)) * 100"></div>
              </div>
              <p class="muted small">Used {{ b.used }} of {{ b.available }} days</p>
            </div>
          </div>
          <div class="divider"></div>
          <div>
            <p class="eyebrow small">Request leave</p>
            <form class="form-grid" [formGroup]="requestForm" (ngSubmit)="submitRequest()">
              <label>Leave Type
                <select formControlName="leaveTypeCode">
                  <option value="">Select</option>
                  <option *ngFor="let t of hr.leaveTypes()" [value]="t.code">{{ t.name }}</option>
                </select>
                <span class="error" *ngIf="controlInvalid(requestForm, 'leaveTypeCode')">Choose a leave type.</span>
              </label>
              <label>Start Date
                <input type="date" formControlName="startDate" />
                <span class="error" *ngIf="controlInvalid(requestForm, 'startDate')">Start date required.</span>
              </label>
              <label>End Date
                <input type="date" formControlName="endDate" />
                <span class="error" *ngIf="dateRangeError">End date must be after start date.</span>
              </label>
              <label class="full">Reason
                <textarea rows="3" formControlName="reason"></textarea>
                <span class="error" *ngIf="controlInvalid(requestForm, 'reason')">Provide at least 10 characters.</span>
              </label>
              <div class="actions">
                <app-button variant="primary" size="sm" type="submit" [disabled]="requestForm.invalid || dateRangeError">Submit Request</app-button>
              </div>
            </form>
          </div>
        </app-card>

        <app-card class="panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow small">Leave types</p>
              <h3>Configure</h3>
            </div>
          </div>
          <form class="form-grid" [formGroup]="typeForm" (ngSubmit)="addType()">
            <label>Name
              <input formControlName="name" />
              <span class="error" *ngIf="controlInvalid(typeForm, 'name')">Name required.</span>
            </label>
            <label>Code
              <input formControlName="code" />
              <span class="error" *ngIf="controlInvalid(typeForm, 'code')">Code required.</span>
            </label>
            <label>Days/Year
              <input type="number" min="0" formControlName="daysPerYear" />
              <span class="error" *ngIf="controlInvalid(typeForm, 'daysPerYear')">Enter days.</span>
            </label>
            <label class="inline">
              <input type="checkbox" formControlName="carryForward" /> Carry forward
            </label>
            <div class="actions">
              <app-button variant="primary" size="sm" type="submit" [disabled]="typeForm.invalid">Save type</app-button>
            </div>
          </form>
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
              <span class="muted" style="grid-column:1/5">No leave types.</span>
            </div>
          </div>
        </app-card>
      </div>

      <app-card class="panel approvals">
        <div class="panel-header">
          <div>
            <p class="eyebrow small">Approvals</p>
            <h3>Pending requests</h3>
          </div>
          <div class="filter-chips">
            <button type="button" class="chip" [class.active]="approvalFilter==='pending'" (click)="approvalFilter='pending'">Pending</button>
            <button type="button" class="chip" [class.active]="approvalFilter==='approved'" (click)="approvalFilter='approved'">Approved</button>
            <button type="button" class="chip" [class.active]="approvalFilter==='rejected'" (click)="approvalFilter='rejected'">Rejected</button>
            <button type="button" class="chip" [class.active]="approvalFilter==='all'" (click)="approvalFilter='all'">All</button>
          </div>
        </div>
        <div class="table approvals-table">
          <div class="table-head">
            <span>Staff</span><span>Type</span><span>Dates</span><span>Status</span><span>Comment</span><span>Actions</span>
          </div>
          <div class="table-row" *ngFor="let r of filteredRequests()">
            <span class="strong">{{ resolveStaff(r.staffId) }}</span>
            <span>{{ r.leaveTypeCode }}</span>
            <span>{{ r.startDate | date:'mediumDate' }} - {{ r.endDate | date:'mediumDate' }}</span>
            <span>
              <span class="pill" [class.pending]="r.status==='pending'" [class.success]="r.status==='approved'" [class.danger]="r.status==='rejected'">{{ r.status || 'pending' }}</span>
              <p class="muted small" *ngIf="r.approverName">By {{ r.approverName }}</p>
              <p class="muted small" *ngIf="r.approverComment">“{{ r.approverComment }}”</p>
            </span>
            <span>
              <textarea rows="2" placeholder="Comment" [(ngModel)]="approvalComments[requestId(r)]" [ngModelOptions]="{standalone: true}"></textarea>
              <span class="error" *ngIf="approvalErrors[requestId(r)]">{{ approvalErrors[requestId(r)] }}</span>
            </span>
            <span class="actions-cell">
              <button class="chip" *ngIf="isPending(r)" [disabled]="approvingIds.has(requestId(r))" (click)="approve(r)">Approve</button>
              <button class="chip danger" *ngIf="isPending(r)" [disabled]="approvingIds.has(requestId(r))" (click)="reject(r)">Reject</button>
              <span class="muted small" *ngIf="approvingIds.has(requestId(r))">Saving…</span>
            </span>
          </div>
          <div class="table-row" *ngIf="!filteredRequests().length">
            <span class="muted" style="grid-column:1/6">No leave requests for this filter.</span>
          </div>
        </div>
      </app-card>
    </div>
  `,
  styles: [`
    .page { padding:1.25rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--hr-text-muted); font-weight:700; margin:0 0 0.2rem; }
    .eyebrow.small { font-size:0.75rem; }
    h1 { margin:0; color: var(--hr-text-strong); }
    h3 { margin:0; color: var(--hr-text-strong); }
    .sub { margin:0; color: var(--hr-text-muted); }
    .toast { padding:0.65rem 0.8rem; border-radius:10px; border:1px solid var(--hr-border); background: color-mix(in srgb, var(--hr-surface) 85%, transparent); color: var(--hr-text-strong); font-weight:700; }
    .toast.success { border-color: color-mix(in srgb, var(--color-success, #22c55e) 50%, var(--hr-border)); }
    .toast.error { border-color: color-mix(in srgb, var(--color-error, #ef4444) 50%, var(--hr-border)); }
    .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1rem; }
    .panel { display:grid; gap:0.65rem; background: var(--hr-surface); border:1px solid var(--hr-border); }
    .panel-header { display:flex; justify-content:space-between; align-items:center; }
    .balances { display:grid; gap:0.5rem; }
    .balance-card { padding:0.65rem 0.75rem; border:1px solid var(--hr-border); border-radius:12px; background: var(--hr-surface-strong); display:grid; gap:0.35rem; }
    .row { display:flex; justify-content:space-between; align-items:center; gap:0.5rem; }
    .pill { padding:0.25rem 0.6rem; border-radius:999px; border:1px solid var(--hr-border); background: color-mix(in srgb, var(--hr-surface-strong) 85%, transparent); text-transform:capitalize; }
    .pill.pending { border-color: color-mix(in srgb, var(--color-warning, #f59e0b) 40%, var(--hr-border)); }
    .pill.success { border-color: color-mix(in srgb, var(--color-success, #22c55e) 40%, var(--hr-border)); }
    .pill.danger { border-color: color-mix(in srgb, var(--color-error, #ef4444) 40%, var(--hr-border)); }
    .progress { width:100%; height:6px; background: color-mix(in srgb, var(--hr-surface) 70%, transparent); border-radius:999px; overflow:hidden; }
    .progress .bar { height:100%; background: var(--hr-accent); }
    .divider { height:1px; background: var(--hr-border); margin:0.25rem 0; }
    .form-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:0.75rem; }
    .form-grid .full { grid-column:1/-1; }
    label { display:grid; gap:0.25rem; color: var(--hr-text-strong); font-weight:700; }
    input, select, textarea { border:1px solid var(--hr-border); border-radius:10px; padding:0.55rem 0.6rem; background: color-mix(in srgb, var(--hr-surface-strong) 85%, transparent); color: var(--hr-text-strong); }
    textarea { resize: vertical; min-height: 80px; }
    input.invalid, select.invalid, textarea.invalid { border-color: var(--color-error, #ef4444); }
    .inline { align-items:center; grid-auto-flow:column; grid-auto-columns:max-content; gap:0.4rem; }
    .actions { display:flex; gap:0.5rem; align-items:center; grid-column:1/-1; }
    .table { border:1px solid var(--hr-border); border-radius:12px; overflow:hidden; }
    .table-head, .table-row { display:grid; grid-template-columns: 1.5fr 1fr 1.2fr 1fr 1fr; gap:0.5rem; padding:0.75rem 0.85rem; align-items:center; }
    .approvals-table .table-head, .approvals-table .table-row { grid-template-columns: 1.2fr 1fr 1.2fr 0.8fr 1.3fr 1fr; }
    .table-head { background: var(--hr-surface-strong); font-weight:700; color: var(--hr-text-strong); }
    .table-row { border-top:1px solid var(--hr-border); color: var(--hr-text-muted); }
    .strong { font-weight:800; color: var(--hr-text-strong); }
    .muted { color: var(--hr-text-muted); }
    .muted.small { font-size:0.9rem; }
    .error { color: var(--color-error, #ef4444); font-size:0.85rem; font-weight:600; }
    .actions-cell { display:flex; gap:0.35rem; align-items:center; }
    textarea[ngModel] { width:100%; }
    @media (max-width: 900px) {
      .table-head, .table-row { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
      .approvals-table .table-head, .approvals-table .table-row { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
    }
  `]
})
export class LeaveComponent implements OnInit {
  typeForm: FormGroup;
  requestForm: FormGroup;
  toast = signal<Toast | null>(null);
  balances = signal<Balance[]>([
    { code: 'annual', name: 'Annual Leave', available: 20, used: 8 },
    { code: 'sick', name: 'Sick Leave', available: 10, used: 2 },
    { code: 'casual', name: 'Casual Leave', available: 7, used: 3 }
  ]);
  approvalComments: Record<string, string> = {};
  approvalErrors: Record<string, string> = {};
  approvalFilter: 'all' | 'pending' | 'approved' | 'rejected' = 'pending';
  approvingIds = new Set<string>();

  constructor(public hr: HrService, private fb: FormBuilder) {
    this.typeForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      daysPerYear: [0, [Validators.required, Validators.min(0)]],
      carryForward: [false]
    });
    this.requestForm = this.fb.group({
      leaveTypeCode: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.hr.loadLeaveRequests();
    this.hr.loadLeaveTypes();
  }

  addType() {
    if (this.typeForm.invalid) {
      this.typeForm.markAllAsTouched();
      return;
    }
    const value = this.typeForm.value as LeaveType;
    this.hr.leaveTypes.update(list => [...list, { ...value, id: Math.random().toString(36).slice(2) }]);
    this.showToast('success', 'Leave type saved.');
    this.typeForm.reset({ name: '', code: '', daysPerYear: 0, carryForward: false });
  }

  submitRequest() {
    if (this.requestForm.invalid || this.dateRangeError) {
      this.requestForm.markAllAsTouched();
      return;
    }
    const v = this.requestForm.value as any;
    const newReq: LeaveRequest = {
      id: Math.random().toString(36).slice(2),
      staffId: 'me',
      leaveTypeCode: v.leaveTypeCode,
      startDate: v.startDate,
      endDate: v.endDate,
      status: 'pending',
      days: this.computeDays(v.startDate, v.endDate)
    };
    this.hr.leaveRequests.update(list => [...list, newReq]);
    this.showToast('success', 'Leave request submitted.');
    this.requestForm.reset();
  }

  resolveStaff(id: string) {
    const s = this.hr.staff().find(st => st.id === id || st._id === id);
    return s ? (s.fullName || `${s.firstName} ${s.lastName}`) : id;
  }

  approve(req: any) {
    this.handleDecision(req, 'approved');
  }

  reject(req: any) {
    this.handleDecision(req, 'rejected');
  }

  handleDecision(req: any, status: 'approved' | 'rejected') {
    const id = this.requestId(req);
    const comment = (this.approvalComments[id] || '').trim();
    if (!comment) {
      this.approvalErrors[id] = 'Comment required.';
      return;
    }
    delete this.approvalErrors[id];
    this.approvingIds.add(id);
    setTimeout(() => {
      this.hr.leaveRequests.update(list => list.map(r => r.id === id || r._id === id ? { ...r, status, approverComment: comment, approverName: 'You' } : r));
      this.showToast('success', `Request ${status}.`);
      this.approvalComments[id] = '';
      this.approvingIds.delete(id);
    }, 450);
  }

  controlInvalid(form: FormGroup, control: string) {
    const c = form.get(control);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  requestId(req: any) {
    return req?.id || req?._id || 'pending';
  }

  get dateRangeError() {
    const s = this.requestForm.get('startDate')?.value;
    const e = this.requestForm.get('endDate')?.value;
    if (!s || !e) return false;
    return new Date(s) > new Date(e);
  }

  private computeDays(start: string, end: string) {
    const sd = new Date(start).getTime();
    const ed = new Date(end).getTime();
    return Math.max(1, Math.round((ed - sd) / (1000 * 60 * 60 * 24)) + 1);
  }

  private showToast(type: ToastType, message: string) {
    this.toast.set({ type, message });
    setTimeout(() => this.toast.set(null), 2000);
  }

  filteredRequests() {
    if (this.approvalFilter === 'all') return this.hr.leaveRequests();
    return this.hr.leaveRequests().filter(r => (r.status || 'pending') === this.approvalFilter);
  }

  isPending(req: any) {
    return (req.status || 'pending') === 'pending';
  }
}
