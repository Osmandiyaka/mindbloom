import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SchoolSettings, SchoolSettingsService } from '../../../../core/services/school-settings.service';

@Component({
  selector: 'app-school-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Setup</p>
          <h1>School Settings</h1>
          <p class="sub">Define school profile, academics, locale, and contact details.</p>
        </div>
        <button class="btn primary" (click)="save()" [disabled]="saving">Save Settings</button>
      </header>

      <section class="hero">
        <div class="hero-icon">🏫</div>
        <div class="hero-copy">
          <h2>Make your school profile shine</h2>
          <p>Keep academics, contact, and grading settings aligned for every campus.</p>
          <div class="hero-meta">
            <span>Profile</span>
            <span>Academics</span>
            <span>Departments</span>
            <span>Grades</span>
          </div>
        </div>
        <div class="hero-illustration">
          <div class="bubble bubble-lg"></div>
          <div class="bubble bubble-sm"></div>
          <div class="bubble bubble-xs"></div>
        </div>
      </section>

      <div class="tabs">
        <button class="tab" [class.active]="tab === 'profile'" (click)="tab = 'profile'">Profile</button>
        <button class="tab" [class.active]="tab === 'academics'" (click)="tab = 'academics'">Academics</button>
        <button class="tab" [class.active]="tab === 'contact'" (click)="tab = 'contact'">Contact & Address</button>
        <button class="tab" [class.active]="tab === 'grading'" (click)="tab = 'grading'">Grading</button>
      </div>

      <div class="grid" *ngIf="tab === 'profile'">
        <section class="card">
          <h3><span class="icon">🎓</span> School Profile</h3>
          <label>School Name
            <input [(ngModel)]="model.schoolName" required placeholder="School name" />
          </label>
          <label>Domain
            <input [(ngModel)]="model.domain" placeholder="myschool.edu" />
          </label>
          <label>Website
            <input [(ngModel)]="model.website" placeholder="https://..." />
          </label>
        </section>
      </div>

      <div class="grid" *ngIf="tab === 'contact'">
        <section class="card">
          <h3><span class="icon">☎️</span> Contact</h3>
          <label>Contact Email
            <input type="email" [(ngModel)]="model.contactEmail" placeholder="contact@school.edu" />
          </label>
          <label>Contact Phone
            <input [(ngModel)]="model.contactPhone" placeholder="+1 555-123-4567" />
          </label>
          <label>Logo URL
            <input [(ngModel)]="model.logoUrl" placeholder="https://cdn/logo.png" />
          </label>
        </section>

        <section class="card">
          <h3><span class="icon">📍</span> Address</h3>
          <label>Address Line 1
            <input [(ngModel)]="model.addressLine1" placeholder="123 Main St" />
          </label>
          <label>Address Line 2
            <input [(ngModel)]="model.addressLine2" placeholder="Suite 100" />
          </label>
          <div class="split">
            <label>City
              <input [(ngModel)]="model.city" />
            </label>
            <label>State/Province
              <input [(ngModel)]="model.state" />
            </label>
          </div>
          <div class="split">
            <label>Postal Code
              <input [(ngModel)]="model.postalCode" />
            </label>
            <label>Country
              <input [(ngModel)]="model.country" />
            </label>
          </div>
        </section>
      </div>

      <div class="grid" *ngIf="tab === 'academics'">
        <section class="card">
          <h3><span class="icon">🗓️</span> Locale & Academic Year</h3>
          <label>Timezone
            <input [(ngModel)]="model.timezone" placeholder="America/New_York" />
          </label>
          <label>Locale
            <input [(ngModel)]="model.locale" placeholder="en-US" />
          </label>
          <div class="split">
            <label>Academic Year Start
              <input type="date" name="ayStart" [(ngModel)]="model.academicYear.start" />
            </label>
            <label>Academic Year End
              <input type="date" name="ayEnd" [(ngModel)]="model.academicYear.end" />
            </label>
          </div>
        </section>

        <section class="card">
          <div class="card-header">
            <h3>Departments</h3>
            <button class="chip" type="button" (click)="openModal('dept')">+ Add</button>
          </div>
          <table class="table">
            <thead>
              <tr><th>Name</th><th>Code</th><th></th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let dept of model.departments; let idx = index">
                <td>{{ dept.name }}</td>
                <td>{{ dept.code }}</td>
                <td><button class="chip danger" type="button" (click)="removeDept(idx)">Remove</button></td>
              </tr>
              <tr *ngIf="!model.departments.length"><td colspan="3" class="empty">No departments</td></tr>
            </tbody>
          </table>
        </section>

        <section class="card">
          <div class="card-header">
            <h3>Grades</h3>
            <button class="chip" type="button" (click)="openModal('grade')">+ Add</button>
          </div>
          <table class="table">
            <thead>
              <tr><th>Name</th><th>Code</th><th>Level</th><th></th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let grade of model.grades; let idx = index">
                <td>{{ grade.name }}</td>
                <td>{{ grade.code }}</td>
                <td>{{ grade.level }}</td>
                <td><button class="chip danger" type="button" (click)="removeGrade(idx)">Remove</button></td>
              </tr>
              <tr *ngIf="!model.grades.length"><td colspan="4" class="empty">No grades</td></tr>
            </tbody>
          </table>
        </section>

        <section class="card">
          <div class="card-header">
            <h3>Subjects</h3>
            <button class="chip" type="button" (click)="openModal('subject')">+ Add</button>
          </div>
          <table class="table">
            <thead>
              <tr><th>Name</th><th>Code</th><th></th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let subj of model.subjects; let idx = index">
                <td>{{ subj.name }}</td>
                <td>{{ subj.code }}</td>
                <td><button class="chip danger" type="button" (click)="removeSubject(idx)">Remove</button></td>
              </tr>
              <tr *ngIf="!model.subjects.length"><td colspan="3" class="empty">No subjects</td></tr>
            </tbody>
          </table>
        </section>
      </div>

      <div class="grid" *ngIf="tab === 'grading'">
        <section class="card">
          <h3><span class="icon">📊</span> Grading Scheme</h3>
          <label>Type
            <select [(ngModel)]="model.gradingScheme.type">
              <option>Percentage</option>
              <option>Letter</option>
              <option>GPA</option>
            </select>
          </label>
          <label>Pass Threshold
            <input type="number" [(ngModel)]="model.gradingScheme.passThreshold" min="0" max="100" />
          </label>
        </section>
      </div>

      <div class="footer-actions">
        <button class="btn primary" (click)="save()" [disabled]="saving">Save Settings</button>
        <span class="muted" *ngIf="saved">Settings saved.</span>
        <span class="error" *ngIf="saveError">{{ saveError }}</span>
      </div>

      <div class="modal-backdrop" *ngIf="activeModal">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ modalTitle }}</h3>
            <button class="chip" type="button" (click)="closeModal()">✕</button>
          </div>
          <form (ngSubmit)="submitModal()">
            <div *ngIf="activeModal === 'dept'" class="form-stack">
              <label>Name
                <input [(ngModel)]="newDept.name" name="deptName" required placeholder="e.g. Mathematics" />
              </label>
              <label>Code
                <input [(ngModel)]="newDept.code" name="deptCode" placeholder="MATH" />
              </label>
            </div>

            <div *ngIf="activeModal === 'grade'" class="form-stack">
              <label>Name
                <input [(ngModel)]="newGrade.name" name="gradeName" required placeholder="Grade 7" />
              </label>
              <label>Code
                <input [(ngModel)]="newGrade.code" name="gradeCode" placeholder="G7" />
              </label>
              <label>Level
                <input [(ngModel)]="newGrade.level" name="gradeLevel" placeholder="Middle School" />
              </label>
            </div>

            <div *ngIf="activeModal === 'subject'" class="form-stack">
              <label>Name
                <input [(ngModel)]="newSubject.name" name="subjectName" required placeholder="Biology" />
              </label>
              <label>Code
                <input [(ngModel)]="newSubject.code" name="subjectCode" placeholder="BIO" />
              </label>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn primary">Add</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1.25rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; }
    .eyebrow { text-transform:uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .btn { border-radius:10px; border:1px solid var(--color-border); padding:0.75rem 1.2rem; font-weight:600; cursor:pointer; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 8px 18px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .hero { position:relative; overflow:hidden; border-radius:16px; border:1px solid var(--color-border); background: radial-gradient(circle at 20% 20%, rgba(var(--color-primary-rgb,122,184,255),0.25), transparent 40%), linear-gradient(135deg, rgba(var(--color-primary-rgb,122,184,255),0.12), rgba(168,129,255,0.12)); padding:1rem 1.25rem; display:flex; gap:1rem; align-items:center; }
    .hero-icon { font-size:2.25rem; background: rgba(255,255,255,0.08); padding:0.75rem; border-radius:12px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.08); }
    .hero-copy h2 { margin:0 0 0.25rem; color: var(--color-text-primary); }
    .hero-copy p { margin:0 0 0.4rem; color: var(--color-text-secondary); }
    .hero-meta { display:flex; flex-wrap:wrap; gap:0.35rem; }
    .hero-meta span { background: rgba(255,255,255,0.08); padding:0.35rem 0.6rem; border-radius:999px; font-size:0.85rem; color: var(--color-text-primary); }
    .hero-illustration { flex:1; display:flex; justify-content:flex-end; align-items:center; gap:0.5rem; opacity:0.9; }
    .bubble { border-radius:50%; backdrop-filter: blur(8px); background: rgba(255,255,255,0.08); box-shadow: 0 8px 18px rgba(0,0,0,0.25); }
    .bubble-lg { width:90px; height:90px; }
    .bubble-sm { width:60px; height:60px; }
    .bubble-xs { width:36px; height:36px; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap:1rem; }
    .tabs { display:flex; gap:0.5rem; margin-top:0.5rem; }
    .tab { padding:0.6rem 1rem; border-radius:10px; border:1px solid var(--color-border); background: var(--color-surface-hover); cursor:pointer; font-weight:600; color: var(--color-text-primary); }
    .tab.active { border-color: var(--color-primary); box-shadow: 0 6px 14px rgba(var(--color-primary-rgb,123,140,255),0.2); }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1.25rem; box-shadow: var(--shadow-sm); display:flex; flex-direction:column; gap:0.65rem; }
    .card h3 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .card .icon { margin-right:0.35rem; }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    input, select { border:1px solid var(--color-border); border-radius:8px; padding:0.65rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .split { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:0.5rem; }
    .list { display:flex; gap:0.35rem; align-items:center; flex-wrap:wrap; }
    .chip { border:1px solid var(--color-border); border-radius:8px; padding:0.45rem 0.75rem; background: var(--color-surface-hover); cursor:pointer; }
    .chip.danger { border-color: rgba(var(--color-error-rgb,239,68,68),0.3); color: var(--color-error,#ef4444); }
    .footer-actions { display:flex; align-items:center; gap:0.75rem; }
    .muted { color: var(--color-text-secondary); }
    .error { color: var(--color-error,#ef4444); font-weight:600; }
    .card-header { display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-bottom:0.25rem; }
    .table { width:100%; border-collapse:collapse; font-size:0.95rem; }
    .table th, .table td { text-align:left; padding:0.55rem 0.6rem; border-bottom:1px solid var(--color-border); }
    .table th { color: var(--color-text-secondary); font-weight:700; text-transform:uppercase; font-size:0.8rem; letter-spacing:0.04em; }
    .table tbody tr:hover td { background: var(--color-surface-hover); }
    .empty { text-align:center; color: var(--color-text-secondary); padding:0.75rem 0; }
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:50; }
    .modal { background: var(--color-surface); border-radius:14px; padding:1.25rem; width:min(480px, 90vw); border:1px solid var(--color-border); box-shadow: 0 20px 48px rgba(0,0,0,0.35); }
    .modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
    .form-stack { display:flex; flex-direction:column; gap:0.65rem; }
    .modal-actions { display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem; }
  `]
})
export class SchoolSettingsComponent implements OnInit {
  model: SchoolSettings & {
    academicYear: { start: string; end: string };
    gradingScheme: { type: string; passThreshold: number };
    departments: { name?: string; code?: string }[];
    grades: { name?: string; code?: string; level?: string }[];
    subjects: { name?: string; code?: string }[];
  } = {
      schoolName: '',
      academicYear: { start: '', end: '' },
      gradingScheme: { type: 'Percentage', passThreshold: 40 },
      departments: [],
      grades: [],
      subjects: []
    };
  saving = false;
  saved = false;
  saveError = '';
  tab: 'profile' | 'academics' | 'contact' | 'grading' = 'profile';

  newDept = { name: '', code: '' };
  newGrade = { name: '', code: '', level: '' };
  newSubject = { name: '', code: '' };
  activeModal: 'dept' | 'grade' | 'subject' | null = null;

  constructor(private settingsService: SchoolSettingsService) { }

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe((data) => {
      this.model = {
        ...this.model,
        ...data,
        academicYear: {
          start: data.academicYear?.start || '',
          end: data.academicYear?.end || ''
        },
        gradingScheme: {
          type: data.gradingScheme?.type || 'Percentage',
          passThreshold: data.gradingScheme?.passThreshold ?? 40
        },
        departments: (data.departments || []).map((d: any) => ({ name: d.name || '', code: d.code || '' })),
        grades: (data.grades || []).map((g: any) => ({ name: g.name || '', code: g.code || '', level: g.level || '' })),
        subjects: (data.subjects || []).map((s: any) => ({ name: s.name || '', code: s.code || '' }))
      };
    });
  }

  save() {
    this.saving = true;
    this.saved = false;
    this.saveError = '';
    this.settingsService.save(this.model).subscribe(() => {
      this.saving = false;
      this.saved = true;
    }, (err) => {
      this.saving = false;
      this.saveError = err?.error?.message || 'Unable to save settings. Please try again.';
    });
  }

  addDept() {
    if (!this.newDept.name) return;
    this.model.departments.push({ ...this.newDept });
    this.newDept = { name: '', code: '' };
  }
  removeDept(idx: number) { this.model.departments.splice(idx, 1); }

  addGrade() {
    if (!this.newGrade.name) return;
    this.model.grades.push({ ...this.newGrade });
    this.newGrade = { name: '', code: '', level: '' };
  }
  removeGrade(idx: number) { this.model.grades.splice(idx, 1); }

  addSubject() {
    if (!this.newSubject.name) return;
    this.model.subjects.push({ ...this.newSubject });
    this.newSubject = { name: '', code: '' };
  }
  removeSubject(idx: number) { this.model.subjects.splice(idx, 1); }

  openModal(type: 'dept' | 'grade' | 'subject') {
    this.activeModal = type;
    if (type === 'dept') this.newDept = { name: '', code: '' };
    if (type === 'grade') this.newGrade = { name: '', code: '', level: '' };
    if (type === 'subject') this.newSubject = { name: '', code: '' };
  }

  closeModal() { this.activeModal = null; }

  submitModal() {
    if (this.activeModal === 'dept') {
      this.addDept();
    } else if (this.activeModal === 'grade') {
      this.addGrade();
    } else if (this.activeModal === 'subject') {
      this.addSubject();
    }
    this.closeModal();
  }

  get modalTitle() {
    if (this.activeModal === 'dept') return 'Add Department';
    if (this.activeModal === 'grade') return 'Add Grade';
    if (this.activeModal === 'subject') return 'Add Subject';
    return '';
  }
}
