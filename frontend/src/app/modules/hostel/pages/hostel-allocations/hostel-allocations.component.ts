import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HostelService } from '../../../../core/services/hostel.service';
import { StudentService } from '../../../../core/services/student.service';
import { Student } from '../../../../core/models/student.model';

@Component({
  selector: 'app-hostel-allocations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Hostel</p>
          <h1>Allocations</h1>
          <p class="sub">Assign students to beds and track occupancy.</p>
        </div>
      </header>

      <section class="card">
        <h3>Assign Bed</h3>
        <form class="grid" (ngSubmit)="assign()">
          <label>Student
            <select [(ngModel)]="allocForm.studentId" name="studentId" required>
              <option value="" disabled>Select student</option>
              <option *ngFor="let s of students" [value]="s.id">{{ s.fullName || s.firstName + ' ' + s.lastName }}</option>
            </select>
          </label>
          <label>Hostel
            <select [(ngModel)]="allocForm.hostelId" name="hostelId" (change)="onHostelChange()" required>
              <option value="" disabled>Select hostel</option>
              <option *ngFor="let h of hostel.hostels()" [value]="h.id">{{ h.name }}</option>
            </select>
          </label>
          <label>Room
            <select [(ngModel)]="allocForm.roomId" name="roomId" (change)="onRoomChange()" required>
              <option value="" disabled>Select room</option>
              <option *ngFor="let r of roomsForHostel" [value]="r.id">{{ r.name }}</option>
            </select>
          </label>
          <label>Bed
            <select [(ngModel)]="allocForm.bedId" name="bedId" required>
              <option value="" disabled>Select bed</option>
              <option *ngFor="let b of bedsForRoom" [value]="b.id">{{ b.label }}</option>
            </select>
          </label>
          <label>Start Date
            <input type="date" [(ngModel)]="allocForm.startDate" name="startDate" required />
          </label>
          <div class="actions">
            <button class="btn primary" type="submit">Allocate</button>
          </div>
        </form>
      </section>

      <section class="card">
        <div class="card-header"><h3>Active Allocations</h3></div>
        <div class="table">
          <div class="table-head">
            <span>Student</span><span>Hostel</span><span>Room/Bed</span><span>Dates</span><span>Status</span><span>Action</span>
          </div>
          <div class="table-row" *ngFor="let a of hostel.allocations()">
            <span class="strong">{{ resolveStudent(a.studentId) }}</span>
            <span>{{ resolveHostel(a.hostelId)?.name || '—' }}</span>
            <span>{{ resolveRoom(a.roomId)?.name || '—' }}/{{ resolveBed(a.bedId)?.label || '—' }}</span>
            <span>{{ a.startDate | date:'mediumDate' }} - {{ a.endDate ? (a.endDate | date:'mediumDate') : '—' }}</span>
            <span><span class="pill">{{ a.status }}</span></span>
            <span class="actions-cell">
              <button class="chip" *ngIf="a.status === 'active'" (click)="end(a)">End</button>
            </span>
          </div>
          <div class="table-row" *ngIf="!hostel.allocations().length">
            <span class="muted" style="grid-column:1/5">No allocations.</span>
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
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap:0.75rem; }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    select, input { border:1px solid var(--color-border); border-radius:8px; padding:0.55rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .actions { display:flex; align-items:center; gap:0.5rem; grid-column:1/-1; }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); cursor:pointer; }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; margin-top:0.5rem; }
    .table-head, .table-row { display:grid; grid-template-columns: 1.4fr 1fr 1fr 1.2fr 0.8fr 0.8fr; gap:0.5rem; padding:0.8rem 0.9rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .pill { padding:0.2rem 0.45rem; border-radius:10px; background: var(--color-surface-hover); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .muted { color: var(--color-text-secondary); }
    .actions-cell { display:flex; gap:0.35rem; }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.7rem; border-radius:10px; background: var(--color-surface-hover); cursor:pointer; }
  `]
})
export class HostelAllocationsComponent implements OnInit {
  allocForm: any = { studentId: '', hostelId: '', roomId: '', bedId: '', startDate: new Date().toISOString().slice(0,10) };
  students: Student[] = [];

  constructor(public hostel: HostelService, private studentService: StudentService) {}

  ngOnInit(): void {
    this.hostel.loadHostels();
    this.hostel.loadRooms();
    this.hostel.loadBeds();
    this.hostel.loadAllocations({ status: 'active' });
    this.studentService.getStudents({}).subscribe(studs => this.students = studs.map(s => ({ ...s, id: (s as any).id || (s as any)._id } as Student)));
  }

  get roomsForHostel() {
    return this.hostel.rooms().filter(r => r.hostelId === this.allocForm.hostelId);
  }

  get bedsForRoom() {
    return this.hostel.beds().filter(b => b.roomId === this.allocForm.roomId && b.status === 'available');
  }

  onHostelChange() {
    this.allocForm.roomId = '';
    this.allocForm.bedId = '';
    if (this.allocForm.hostelId) this.hostel.loadRooms(this.allocForm.hostelId);
  }

  onRoomChange() {
    this.allocForm.bedId = '';
    if (this.allocForm.roomId) this.hostel.loadBeds(this.allocForm.roomId);
  }

  assign() {
    if (!this.allocForm.studentId || !this.allocForm.hostelId || !this.allocForm.roomId || !this.allocForm.bedId) return;
    this.hostel.createAllocation({ ...this.allocForm, startDate: new Date(this.allocForm.startDate) });
  }

  end(a: any) {
    this.hostel.endAllocation(a.id || a._id);
  }

  resolveStudent(id: string) {
    const found = this.students.find(s => s.id === id || (s as any)._id === id);
    return found ? (found.fullName || `${found.firstName} ${found.lastName}`) : id;
  }
  resolveHostel(id: string) { return this.hostel.hostels().find(h => h.id === id || (h as any)._id === id); }
  resolveRoom(id: string) { return this.hostel.rooms().find(r => r.id === id || (r as any)._id === id); }
  resolveBed(id: string) { return this.hostel.beds().find(b => b.id === id || (b as any)._id === id); }
}
