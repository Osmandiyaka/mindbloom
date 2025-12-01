import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SchoolSettings, SchoolSettingsService } from '../../../../core/services/school-settings.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { TenantSettingsService } from '../../../../core/services/tenant-settings.service';

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
      </header>

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
      <div class="section-actions" *ngIf="tab === 'profile'">
        <button class="btn primary" (click)="saveProfile()" [disabled]="saving">Save Settings</button>
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
      <div class="section-actions" *ngIf="tab === 'contact'">
        <button class="btn primary" (click)="saveContact()" [disabled]="saving">Save Settings</button>
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
          <div class="split equal">
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
      <div class="section-actions" *ngIf="tab === 'academics'">
        <button class="btn primary" (click)="saveAcademics()" [disabled]="saving">Save Settings</button>
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
      <div class="section-actions" *ngIf="tab === 'grading'">
        <button class="btn primary" (click)="saveGrading()" [disabled]="saving">Save Settings</button>
      </div>

      <div class="footer-actions" *ngIf="saveError || saved">
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
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1.25rem; background: var(--color-surface); color: var(--color-text-primary); border: 1px solid var(--color-border); border-radius: 12px; box-shadow: var(--shadow-sm); }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; }
    .eyebrow { text-transform:uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .btn { border-radius:10px; border:1px solid var(--color-border); padding:0.75rem 1.2rem; font-weight:600; cursor:pointer; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary)); color: var(--color-background, #0f172a); border:none; box-shadow: var(--shadow-md, 0 8px 18px rgba(0,0,0,0.22)); }
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap:1rem; }
    .tabs { display:flex; gap:0.5rem; margin-top:0.5rem; }
    .tab { padding:0.6rem 1rem; border-radius:10px; border:1px solid var(--color-border); background: var(--color-surface-hover); cursor:pointer; font-weight:600; color: var(--color-text-primary); }
    .tab.active { border-color: var(--color-primary); box-shadow: 0 6px 14px rgba(var(--color-primary-rgb,123,140,255),0.2); }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1.25rem; box-shadow: var(--shadow-sm); display:flex; flex-direction:column; gap:0.65rem; }
    .card h3 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .card .icon { margin-right:0.35rem; }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    input, select {
      border:1px solid var(--color-border);
      border-radius:8px;
      padding:0.65rem;
      background: var(--color-surface-hover);
      color: var(--color-text-primary);
      transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.12));
    }
    input::placeholder, select::placeholder { color: var(--color-text-secondary); }
    input:focus, select:focus {
      outline:none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 30%, transparent);
      background: color-mix(in srgb, var(--color-surface-hover) 70%, var(--color-background) 30%);
    }
    .split { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:0.5rem; align-items:end; }
    .split.equal label { width: 100%; }
    .list { display:flex; gap:0.35rem; align-items:center; flex-wrap:wrap; }
    .chip { border:1px solid var(--color-border); border-radius:8px; padding:0.45rem 0.75rem; background: var(--color-surface-hover); cursor:pointer; }
    .chip.danger { border-color: rgba(var(--color-error-rgb,239,68,68),0.3); color: var(--color-error,#ef4444); }
    .footer-actions { display:flex; align-items:center; gap:0.75rem; }
    .muted { color: var(--color-text-secondary); }
    .error { color: var(--color-error,#ef4444); font-weight:600; }
    .card-header { display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-bottom:0.25rem; }
    .table { width:100%; border-collapse:collapse; font-size:0.95rem; background: var(--color-surface); color: var(--color-text-primary); }
    .table th, .table td { text-align:left; padding:0.55rem 0.6rem; border-bottom:1px solid var(--color-border); background: var(--color-surface); }
    .table th { color: var(--color-text-secondary); font-weight:700; text-transform:uppercase; font-size:0.8rem; letter-spacing:0.04em; background: var(--color-surface-hover); }
    .table tbody tr:nth-child(even) td { background: var(--color-surface-hover); }
    .table tbody tr:hover td { background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface)); }
    .empty { text-align:center; color: var(--color-text-secondary); padding:0.75rem 0; background: var(--color-surface); }
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:50; }
    .modal { background: var(--color-surface); border-radius:14px; padding:1.25rem; width:min(480px, 90vw); border:1px solid var(--color-border); box-shadow: 0 20px 48px rgba(0,0,0,0.35); }
    .modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
    .form-stack { display:flex; flex-direction:column; gap:0.65rem; }
    .modal-actions { display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem; }
  `]
})
export class SchoolSettingsComponent implements OnInit {
  private tenantService = inject(TenantService);
  private tenantSettingsService = inject(TenantSettingsService);
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
    const tenant = this.tenantService.getCurrentTenantValue();
    if (tenant?.name && !this.model.schoolName) {
      this.model.schoolName = tenant.name;
    }

    this.settingsService.getSettings().subscribe((data) => {
      this.model = {
        ...this.model,
        ...data,
        schoolName: data.schoolName || this.model.schoolName,
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

  saveProfile() {
    this.saving = true;
    this.saved = false;
    this.saveError = '';
    const payload: Partial<SchoolSettings> = this.cleanPayload({
      schoolName: this.model.schoolName,
      domain: this.model.domain,
      website: this.model.website
    });

    this.settingsService.save(payload as SchoolSettings).subscribe(() => {
      this.saving = false;
      this.saved = true;
    }, (err) => {
      this.saving = false;
      this.saveError = err?.error?.message || 'Unable to save settings. Please try again.';
    });
  }

  saveContact() {
    this.saving = true;
    this.saved = false;
    this.saveError = '';
    const payload: Partial<SchoolSettings> = this.cleanPayload({
      contactEmail: this.model.contactEmail,
      contactPhone: this.model.contactPhone,
      logoUrl: this.model.logoUrl,
      addressLine1: this.model.addressLine1,
      addressLine2: this.model.addressLine2,
      city: this.model.city,
      state: this.model.state,
      postalCode: this.model.postalCode,
      country: this.model.country
    });
    this.settingsService.save(payload as SchoolSettings).subscribe(() => {
      this.saving = false;
      this.saved = true;
    }, (err) => {
      this.saving = false;
      this.saveError = err?.error?.message || 'Unable to save settings. Please try again.';
    });
  }

  saveAcademics() {
    this.saving = true;
    this.saved = false;
    this.saveError = '';
    const payload: Partial<SchoolSettings> = this.cleanPayload({
      timezone: this.model.timezone,
      locale: this.model.locale,
      academicYear: {
        start: this.model.academicYear?.start,
        end: this.model.academicYear?.end
      },
      departments: this.model.departments,
      grades: this.model.grades,
      subjects: this.model.subjects
    });
    this.settingsService.save(payload as SchoolSettings).subscribe(() => {
      this.saving = false;
      this.saved = true;
    }, (err) => {
      this.saving = false;
      this.saveError = err?.error?.message || 'Unable to save settings. Please try again.';
    });
  }

  saveGrading() {
    this.saving = true;
    this.saved = false;
    this.saveError = '';
    const payload: Partial<SchoolSettings> = this.cleanPayload({
      gradingScheme: this.model.gradingScheme
    });
    this.settingsService.save(payload as SchoolSettings).subscribe(() => {
      this.saving = false;
      this.saved = true;
    }, (err) => {
      this.saving = false;
      this.saveError = err?.error?.message || 'Unable to save settings. Please try again.';
    });
  }

  private cleanPayload<T extends Record<string, any>>(obj: T): T {
    const cleaned: Record<string, any> = {};
    Object.entries(obj).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      cleaned[key] = value;
    });
    return cleaned as T;
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
