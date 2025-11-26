import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HrService } from '../../../../core/services/hr.service';

@Component({
  selector: 'app-staff-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">HR</p>
          <h1>Staff Directory</h1>
          <p class="sub">Browse and manage staff records.</p>
        </div>
        <button class="btn primary" type="button" (click)="openModal()">Add Staff</button>
      </header>

      <section class="card filters">
        <label>Department
          <select [(ngModel)]="filters.departmentCode" (change)="reload()">
            <option value="">All</option>
            <option *ngFor="let d of hr.departments()" [value]="d.code">{{ d.name }}</option>
          </select>
        </label>
        <label>Designation
          <select [(ngModel)]="filters.designationCode" (change)="reload()">
            <option value="">All</option>
            <option *ngFor="let d of hr.designations()" [value]="d.code">{{ d.name }}</option>
          </select>
        </label>
        <label>Status
          <select [(ngModel)]="filters.status" (change)="reload()">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </select>
        </label>
        <div class="actions">
          <label>Name
            <input [(ngModel)]="filters.search" (keyup.enter)="reload()" placeholder="Search name" />
          </label>
          <button class="btn" (click)="reload()">Search</button>
        </div>
      </section>

      <section class="card">
        <div class="table-head">
          <span>👤 Name</span>
          <span>Department</span>
          <span>Designation</span>
          <span>Status</span>
        </div>
        <div class="table-row clickable" *ngFor="let s of hr.staff()" (click)="select(s)">
          <span class="strong">{{ s.fullName || (s.firstName + ' ' + s.lastName) }}</span>
          <span>{{ s.departmentCode || '—' }}</span>
          <span>{{ s.designationCode || '—' }}</span>
          <span><span class="pill">{{ s.status || 'active' }}</span></span>
        </div>
        <div class="table-row" *ngIf="!hr.staff().length">
          <span class="muted" style="grid-column:1/4">No staff found.</span>
        </div>
      </section>

      <section class="card" *ngIf="selected">
        <div class="card-header">
          <h3>👤 {{ selected.fullName || (selected.firstName + ' ' + selected.lastName) }}</h3>
          <span class="pill">{{ selected.status || 'active' }}</span>
        </div>
        <div class="detail-grid">
          <div><strong>Email:</strong> {{ selected.email || '—' }}</div>
          <div><strong>Phone:</strong> {{ selected.phone || '—' }}</div>
          <div><strong>Department:</strong> {{ selected.departmentCode || '—' }}</div>
          <div><strong>Designation:</strong> {{ selected.designationCode || '—' }}</div>
          <div><strong>Employee ID:</strong> {{ selected.employeeId || '—' }}</div>
          <div><strong>Join Date:</strong> {{ selected.joinDate | date:'mediumDate' }}</div>
          <div><strong>Contract:</strong> {{ selected.contractType || '—' }}</div>
          <div><strong>Salary:</strong> {{ selected.salary?.amount || '—' }} {{ selected.salary?.currency || '' }} ({{ selected.salary?.frequency || '' }})</div>
          <div><strong>Address:</strong> {{ selected.address?.street || '' }} {{ selected.address?.city || '' }}</div>
          <div><strong>Emergency:</strong> {{ selected.emergencyContacts?.[0]?.name || '—' }} ({{ selected.emergencyContacts?.[0]?.phone || '' }})</div>
        </div>
      </section>

      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal">
          <div class="modal-header">
            <h3>➕ New Staff</h3>
            <button class="chip" type="button" (click)="closeModal()">✕</button>
          </div>
          <form class="modal-grid" (ngSubmit)="addStaff()">
            <label>First Name
              <input [(ngModel)]="staffForm.firstName" name="firstName" required />
            </label>
            <label>Middle Name
              <input [(ngModel)]="staffForm.middleName" name="middleName" />
            </label>
            <label>Last Name
              <input [(ngModel)]="staffForm.lastName" name="lastName" required />
            </label>
            <label>Email
              <input type="email" [(ngModel)]="staffForm.email" name="email" />
            </label>
            <label>Phone
              <input [(ngModel)]="staffForm.phone" name="phone" />
            </label>
            <label>Gender
              <select [(ngModel)]="staffForm.gender" name="gender">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>Date of Birth
              <input type="date" [(ngModel)]="staffForm.dateOfBirth" name="dateOfBirth" />
            </label>
            <label>Department
              <select [(ngModel)]="staffForm.departmentCode" name="departmentCode">
                <option value="">Select</option>
                <option *ngFor="let d of hr.departments()" [value]="d.code">{{ d.name }}</option>
              </select>
            </label>
            <label>Designation
              <select [(ngModel)]="staffForm.designationCode" name="designationCode">
                <option value="">Select</option>
                <option *ngFor="let d of hr.designations()" [value]="d.code">{{ d.name }}</option>
              </select>
            </label>
            <label>Employee ID
              <input [(ngModel)]="staffForm.employeeId" name="employeeId" />
            </label>
            <label>Join Date
              <input type="date" [(ngModel)]="staffForm.joinDate" name="joinDate" />
            </label>
            <label>Status
              <select [(ngModel)]="staffForm.status" name="status">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </label>
            <label>Contract Type
              <select [(ngModel)]="staffForm.contractType" name="contractType">
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
              </select>
            </label>
            <label>Salary Amount
              <input type="number" min="0" step="0.01" [(ngModel)]="staffForm.salary.amount" name="salaryAmount" />
            </label>
            <label>Salary Currency
              <input [(ngModel)]="staffForm.salary.currency" name="salaryCurrency" placeholder="USD" />
            </label>
            <label>Salary Frequency
              <select [(ngModel)]="staffForm.salary.frequency" name="salaryFrequency">
                <option value="monthly">Monthly</option>
                <option value="hourly">Hourly</option>
                <option value="annual">Annual</option>
              </select>
            </label>
            <label>Address Line
              <input [(ngModel)]="staffForm.address.street" name="addressStreet" />
            </label>
            <label>City
              <input [(ngModel)]="staffForm.address.city" name="addressCity" />
            </label>
            <label>State
              <input [(ngModel)]="staffForm.address.state" name="addressState" />
            </label>
            <label>Postal Code
              <input [(ngModel)]="staffForm.address.postalCode" name="addressPostal" />
            </label>
            <label>Country
              <input [(ngModel)]="staffForm.address.country" name="addressCountry" />
            </label>
            <label>Emergency Contact Name
              <input [(ngModel)]="staffForm.emergencyContacts[0].name" name="emgName" />
            </label>
            <label>Emergency Contact Phone
              <input [(ngModel)]="staffForm.emergencyContacts[0].phone" name="emgPhone" />
            </label>
            <label>Emergency Relationship
              <input [(ngModel)]="staffForm.emergencyContacts[0].relationship" name="emgRelation" />
            </label>
            <label>Subjects
              <input [(ngModel)]="subjectsInput" name="subjects" placeholder="Comma separated e.g. Math, Physics" />
            </label>
            <div class="modal-actions">
              <button class="btn" type="button" (click)="closeModal()">Cancel</button>
              <button class="btn primary" type="submit">Save Staff</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .filters { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; align-items:end; }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    select, input { border:1px solid var(--color-border); border-radius:8px; padding:0.55rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .actions { display:flex; gap:0.5rem; align-items:flex-end; }
    .btn { border-radius:10px; padding:0.6rem 1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); cursor:pointer; }
    .table-head, .table-row { display:grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap:0.5rem; padding:0.8rem 0.9rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .clickable { cursor:pointer; }
    .pill { padding:0.25rem 0.6rem; border-radius:10px; background: var(--color-surface-hover); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .muted { color: var(--color-text-secondary); }
    .form-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; }
    .detail-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap:0.5rem; }
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.55); display:flex; align-items:center; justify-content:center; z-index:50; }
    .modal { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; width:min(900px, 96vw); max-height:90vh; overflow:auto; box-shadow: 0 24px 48px rgba(0,0,0,0.35); }
    .modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
    .modal-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap:0.75rem; }
    .modal-actions { grid-column:1 / -1; display:flex; justify-content:flex-end; gap:0.5rem; margin-top:0.5rem; }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.7rem; border-radius:10px; background: var(--color-surface-hover); cursor:pointer; }
  `]
})
export class StaffDirectoryComponent implements OnInit {
  filters: any = { departmentCode: '', designationCode: '', status: '', search: '' };
  staffForm: any = {
    firstName: '', middleName: '', lastName: '', email: '', phone: '',
    gender: '', dateOfBirth: '', departmentCode: '', designationCode: '',
    employeeId: '', joinDate: '', status: 'active', contractType: 'full-time',
    salary: { amount: 0, currency: 'USD', frequency: 'monthly' },
    address: { street: '', city: '', state: '', postalCode: '', country: '' },
    emergencyContacts: [{ name: '', phone: '', relationship: '' }],
    subjects: []
  };
  selected: any = null;
  showModal = false;
  subjectsInput = '';

  constructor(public hr: HrService) {}

  ngOnInit(): void {
    this.reload();
  }

  reload() {
    const params: any = {};
    if (this.filters.departmentCode) params.departmentCode = this.filters.departmentCode;
    if (this.filters.designationCode) params.designationCode = this.filters.designationCode;
    if (this.filters.status) params.status = this.filters.status;
    this.hr.loadStaff(params);
  }

  addStaff() {
    if (!this.staffForm.firstName || !this.staffForm.lastName) return;
    this.staffForm.subjects = this.subjectsInput
      ? this.subjectsInput.split(',').map((s: string) => s.trim()).filter((s: string) => s)
      : [];
    this.hr.createStaff({
      ...this.staffForm,
      fullName: `${this.staffForm.firstName} ${this.staffForm.lastName}`
    });
    this.staffForm = {
      firstName: '', middleName: '', lastName: '', email: '', phone: '',
      gender: '', dateOfBirth: '', departmentCode: '', designationCode: '',
      employeeId: '', joinDate: '', status: 'active', contractType: 'full-time',
      salary: { amount: 0, currency: 'USD', frequency: 'monthly' },
      address: { street: '', city: '', state: '', postalCode: '', country: '' },
      emergencyContacts: [{ name: '', phone: '', relationship: '' }],
      subjects: []
    };
    this.subjectsInput = '';
    this.closeModal();
  }

  select(s: any) {
    this.selected = s;
  }

  openModal() { this.showModal = true; }
  closeModal() { this.showModal = false; }
}
