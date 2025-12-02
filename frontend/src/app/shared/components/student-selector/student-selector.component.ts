import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface StudentOption {
  id: string;
  name: string;
  className: string;
  admissionNo: string;
  photo?: string;
}

@Component({
  selector: 'app-student-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="student-selector">
      <button class="selector-btn" type="button" (click)="open()">
        <ng-container *ngIf="selectedStudent; else placeholder">
          <span class="avatar" [style.background-image]="selectedStudent.photo ? 'url(' + selectedStudent.photo + ')' : ''">
            <span *ngIf="!selectedStudent.photo">{{ initials(selectedStudent.name) }}</span>
          </span>
          <div class="info">
            <p class="name">{{ selectedStudent.name }}</p>
            <p class="meta">{{ selectedStudent.className }} · {{ selectedStudent.admissionNo }}</p>
          </div>
        </ng-container>
        <ng-template #placeholder>
          <span class="avatar empty">👤</span>
          <div class="info">
            <p class="name muted">Select student</p>
            <p class="meta">Tap to choose</p>
          </div>
        </ng-template>
        <span class="chevron">▾</span>
      </button>

      <div class="overlay" *ngIf="openDialog" (click)="close()"></div>
      <div class="dialog" *ngIf="openDialog">
        <div class="dialog-header">
          <div>
            <p class="eyebrow">Students</p>
            <h3>Select a student</h3>
          </div>
          <button class="chip" (click)="close()">✕</button>
        </div>
        <div class="dialog-body">
          <input type="search" [(ngModel)]="search" placeholder="Search by name or admission #" />
          <div class="table">
            <div class="table-head">
              <span>Student</span><span>Admission</span><span>Class</span><span></span>
            </div>
            <div class="table-row" *ngFor="let s of filteredStudents" (click)="select(s)" [class.active]="s.id === selectedId">
              <div class="cell main">
                <span class="avatar small" [style.background-image]="s.photo ? 'url(' + s.photo + ')' : ''">
                  <span *ngIf="!s.photo">{{ initials(s.name) }}</span>
                </span>
                <div>
                  <p class="name">{{ s.name }}</p>
                  <p class="meta">{{ s.className }}</p>
                </div>
              </div>
              <span>{{ s.admissionNo }}</span>
              <span>{{ s.className }}</span>
              <span class="select-cell">
                <input type="radio" [checked]="s.id === selectedId" />
              </span>
            </div>
            <div class="table-row" *ngIf="!filteredStudents.length">
              <span class="muted" style="grid-column:1/4">No students found.</span>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <span class="muted">{{ selectedStudent ? selectedStudent.name : 'No student selected' }}</span>
          <div class="actions">
            <button class="btn ghost" type="button" (click)="close()">Cancel</button>
            <button class="btn primary" type="button" [disabled]="!selectedId" (click)="apply()">Apply</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .student-selector { position:relative; display:inline-block; }
    .selector-btn { display:flex; align-items:center; gap:0.6rem; border:1px solid var(--color-border); border-radius:12px; padding:0.6rem 0.8rem; background: var(--color-surface); color: var(--color-text-primary); width: 100%; min-width: 260px; text-align:left; box-shadow: var(--shadow-sm); }
    .avatar { width:40px; height:40px; border-radius:12px; background: var(--color-surface-hover); display:flex; align-items:center; justify-content:center; font-weight:700; color: var(--color-text-primary); background-size:cover; background-position:center; }
    .avatar.small { width:32px; height:32px; border-radius:10px; }
    .avatar.empty { background: var(--color-surface-hover); }
    .info { flex:1; min-width:0; }
    .name { margin:0; font-weight:700; color: var(--color-text-primary); }
    .meta { margin:0; color: var(--color-text-secondary); font-size:0.9rem; }
    .muted { color: var(--color-text-secondary); }
    .chevron { color: var(--color-text-secondary); }

    .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:20; }
    .dialog { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width: min(720px, 95vw); background: var(--color-surface); border:1px solid var(--color-border); border-radius:16px; box-shadow: var(--shadow-lg, 0 20px 50px rgba(0,0,0,0.25)); z-index:21; display:flex; flex-direction:column; max-height: 80vh; }
    .dialog-header { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.25rem 0.5rem; color: var(--color-text-primary); }
    .dialog-body { padding:0 1.25rem 1rem; display:flex; flex-direction:column; gap:0.75rem; overflow:auto; }
    .dialog-body input[type="search"] { border:1px solid var(--color-border); border-radius:10px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .table { border:1px solid var(--color-border); border-radius:12px; overflow:hidden; background: var(--color-surface); }
    .table-head, .table-row { display:grid; grid-template-columns: 2fr 1fr 1fr 0.5fr; gap:0.5rem; padding:0.65rem 0.9rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); cursor:pointer; }
    .table-row.active { background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface) 90%); border-left:2px solid var(--color-primary); }
    .cell.main { display:flex; align-items:center; gap:0.6rem; }
    .select-cell { text-align:right; }
    .dialog-footer { padding:0.9rem 1.25rem 1.1rem; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--color-border); }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.75rem; border-radius:10px; background: var(--color-surface-hover); cursor:pointer; }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .btn.ghost { background: transparent; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0; }
    h3 { margin:0; color: var(--color-text-primary); }
  `]
})
export class StudentSelectorComponent {
  @Input() students: StudentOption[] = [
    { id: 's1', name: 'Amaka Obi', className: 'Grade 6', admissionNo: 'ADM-1023' },
    { id: 's2', name: 'Chidi Okeke', className: 'Grade 5', admissionNo: 'ADM-1011' },
    { id: 's3', name: 'Sara Danjuma', className: 'Grade 7', admissionNo: 'ADM-1029' },
  ];
  @Input() selectedId: string | null = null;
  @Output() selectedChange = new EventEmitter<StudentOption | null>();
  @Output() selectedIdChange = new EventEmitter<string | null>();

  openDialog = false;
  search = '';

  get selectedStudent(): StudentOption | null {
    return this.students.find(s => s.id === this.selectedId) || null;
  }

  get filteredStudents(): StudentOption[] {
    const term = this.search.toLowerCase();
    return this.students.filter(s =>
      !term ||
      s.name.toLowerCase().includes(term) ||
      s.admissionNo.toLowerCase().includes(term) ||
      s.className.toLowerCase().includes(term)
    );
  }

  open() {
    this.openDialog = true;
  }

  close() {
    this.openDialog = false;
  }

  select(s: StudentOption) {
    this.selectedId = s.id;
    this.selectedIdChange.emit(this.selectedId);
  }

  apply() {
    const sel = this.selectedStudent;
    this.selectedChange.emit(sel || null);
    this.selectedIdChange.emit(sel?.id || null);
    this.close();
  }

  initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  }
}
