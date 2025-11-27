import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HostelService } from '../../../../core/services/hostel.service';
import { RoomsForPipe } from '../../pipes/rooms-for.pipe';
import { HrService, Staff } from '../../../../core/services/hr.service';

@Component({
  selector: 'app-hostel-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, RoomsForPipe],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Hostel</p>
          <h1>Hostels & Rooms</h1>
          <p class="sub">Manage hostels, rooms, and beds.</p>
        </div>
      </header>

      <section class="stats">
        <div class="stat-card">
          <div class="stat-label">Hostels</div>
          <div class="stat-value">{{ hostel.hostels().length }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Rooms</div>
          <div class="stat-value">{{ hostel.rooms().length }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Beds Available</div>
          <div class="stat-value">{{ bedsAvailable }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Beds Occupied</div>
          <div class="stat-value">{{ bedsOccupied }}</div>
        </div>
      </section>

      <section class="card">
        <h3>➕ Add Hostel</h3>
        <form class="grid" (ngSubmit)="addHostel()">
          <label>Name<input [(ngModel)]="hostelForm.name" name="name" required /></label>
          <label>Code<input [(ngModel)]="hostelForm.code" name="code" required /></label>
          <label>Manager
            <select [(ngModel)]="hostelForm.managerId" name="managerId" (change)="onManagerChange()">
              <option value="">Select</option>
              <option *ngFor="let s of staffList" [value]="s.id">{{ s.fullName || s.firstName + ' ' + s.lastName }}</option>
            </select>
          </label>
          <label>Contact<input [(ngModel)]="hostelForm.managerContact" name="contact" /></label>
          <label>Capacity<input type="number" min="0" [(ngModel)]="hostelForm.capacity" name="capacity" /></label>
          <label>Gender<select [(ngModel)]="hostelForm.gender" name="gender"><option value="mixed">Mixed</option><option value="male">Male</option><option value="female">Female</option></select></label>
          <div class="actions"><button class="btn primary" type="submit">Save</button></div>
        </form>
      </section>

      <section class="card">
        <div class="card-header">
          <h3>Hostels</h3>
        </div>
        <div class="table">
          <div class="table-head"><span>Name</span><span>Code</span><span>Manager</span><span>Capacity</span></div>
          <div class="table-row" *ngFor="let h of hostel.hostels()" (click)="selectHostel(h)">
            <span class="strong">{{ h.name }}</span>
            <span>{{ h.code }}</span>
            <span>{{ h.managerName || '—' }}</span>
            <span>{{ h.capacity || 0 }}</span>
          </div>
        </div>
      </section>

      <section class="card" *ngIf="selectedHostel">
        <div class="card-header">
          <h3>Rooms · {{ selectedHostel.name }}</h3>
          <button class="chip" type="button" (click)="openRoom = !openRoom">Add Room</button>
        </div>
        <form class="grid" *ngIf="openRoom" (ngSubmit)="addRoom()">
          <label>Name<input [(ngModel)]="roomForm.name" name="roomName" required /></label>
          <label>Type<select [(ngModel)]="roomForm.type" name="type"><option value="single">Single</option><option value="double">Double</option><option value="triple">Triple</option><option value="dorm">Dorm</option></select></label>
          <label>Capacity<input type="number" min="1" [(ngModel)]="roomForm.capacity" name="roomCapacity" required /></label>
          <label>Floor<input [(ngModel)]="roomForm.floor" name="floor" /></label>
          <div class="actions"><button class="btn primary" type="submit">Save Room</button></div>
        </form>

        <div class="table">
          <div class="table-head"><span>Room</span><span>Type</span><span>Capacity</span><span>Status</span></div>
          <div class="table-row" *ngFor="let r of hostel.rooms() | roomsFor:selectedHostel.id" (click)="selectRoom(r)">
            <span class="strong">{{ r.name }}</span>
            <span>{{ r.type }}</span>
            <span>{{ r.capacity }}</span>
            <span><span class="pill">{{ r.status }}</span></span>
          </div>
          <div class="table-row" *ngIf="!(hostel.rooms() | roomsFor:selectedHostel.id).length">
            <span class="muted" style="grid-column:1/4">No rooms yet.</span>
          </div>
        </div>
      </section>

      <section class="card" *ngIf="selectedRoom && bedsForSelectedRoom.length">
        <div class="card-header">
          <h3>Beds · {{ selectedRoom.name }}</h3>
          <button class="chip" type="button" (click)="openBed = !openBed">Add Bed</button>
        </div>
        <form class="grid" *ngIf="openBed" (ngSubmit)="addBed()">
          <label>Label<input [(ngModel)]="bedForm.label" name="bedLabel" required /></label>
          <div class="actions"><button class="btn primary" type="submit">Save Bed</button></div>
        </form>
        <div class="table">
          <div class="table-head"><span>Bed</span><span>Status</span></div>
          <div class="table-row" *ngFor="let b of bedsForSelectedRoom">
            <span>{{ b.label }}</span>
            <span><span class="pill">{{ b.status }}</span></span>
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
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    input, select { border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .actions { display:flex; align-items:center; gap:0.5rem; grid-column:1/-1; }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); cursor:pointer; }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; }
    .table-head, .table-row { display:grid; grid-template-columns: repeat(4,1fr); gap:0.5rem; padding:0.8rem 0.9rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .pill { padding:0.2rem 0.45rem; border-radius:10px; background: var(--color-surface-hover); }
    .muted { color: var(--color-text-secondary); }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.7rem; border-radius:10px; background: var(--color-surface-hover); cursor:pointer; }
  `]
})
export class HostelRoomsComponent implements OnInit {
  hostelForm: any = { name: '', code: '', managerId: '', managerName: '', managerContact: '', gender: 'mixed', capacity: 0 };
  roomForm: any = { name: '', type: 'dorm', capacity: 1, floor: '' };
  selectedHostel: any = null;
  openRoom = false;
  selectedRoom: any = null;
  openBed = false;
  bedForm: any = { label: '' };
  get staffList(): Staff[] { return this.hr.staff(); }

  constructor(public hostel: HostelService, private hr: HrService) {}

  ngOnInit(): void {
    this.hostel.loadHostels();
    this.hostel.loadRooms();
    this.hostel.loadBeds();
    this.hr.loadStaff();
  }

  addHostel() {
    if (!this.hostelForm.name || !this.hostelForm.code) return;
    this.hostel.createHostel(this.hostelForm);
    this.hostelForm = { name: '', code: '', managerName: '', managerContact: '', gender: 'mixed', capacity: 0 };
  }

  selectHostel(h: any) {
    this.selectedHostel = h;
    this.hostel.loadRooms(h.id);
  }

  addRoom() {
    if (!this.selectedHostel) return;
    this.hostel.createRoom({ ...this.roomForm, hostelId: this.selectedHostel.id });
    this.roomForm = { name: '', type: 'dorm', capacity: 1, floor: '' };
    this.openRoom = false;
  }

  selectRoom(r: any) {
    this.selectedRoom = r;
    this.hostel.loadBeds(r.id);
  }

  get bedsForSelectedRoom() {
    return this.hostel.beds().filter(b => b.roomId === (this.selectedRoom?.id || ''));
  }

  addBed() {
    if (!this.selectedHostel || !this.selectedRoom || !this.bedForm.label) return;
    this.hostel.createBed({ ...this.bedForm, hostelId: this.selectedHostel.id, roomId: this.selectedRoom.id });
    this.bedForm = { label: '' };
    this.openBed = false;
  }

  get bedsAvailable() {
    return this.hostel.beds().filter(b => b.status === 'available').length;
  }

  get bedsOccupied() {
    return this.hostel.beds().filter(b => b.status === 'occupied').length;
  }

  onManagerChange() {
    const mgr = this.staffList.find(s => s.id === this.hostelForm.managerId);
    if (mgr) {
      this.hostelForm.managerName = mgr.fullName || `${mgr.firstName} ${mgr.lastName}`;
      this.hostelForm.managerContact = mgr.phone || mgr.email || '';
    }
  }
}
