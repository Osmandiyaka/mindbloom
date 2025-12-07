import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
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
          <h1>School Settings</h1>
          <p class="sub">Define school profile, academics, locale, and contact details.</p>
        </div>
      </header>

      <div class="tabs segmented" [style.--active-index]="activeTabIndex">
        <button class="tab" [class.active]="tab === 'profile'" (click)="tab = 'profile'">Profile</button>
        <button class="tab" [class.active]="tab === 'academics'" (click)="tab = 'academics'">Academics</button>
        <button class="tab" [class.active]="tab === 'contact'" (click)="tab = 'contact'">Contact & Address</button>
        <button class="tab" [class.active]="tab === 'grading'" (click)="tab = 'grading'">Grading</button>
      </div>

      <div class="grid" *ngIf="tab === 'profile'">
        <section class="card flat">
          <div class="branding-card">
            <div class="branding-header">
              <div>
                <p class="eyebrow subtle">Branding</p>
                <h3 class="branding-title">Identity</h3>
                <p class="muted tiny">Upload your logo and favicon to personalize reports and emails.</p>
              </div>
            </div>
            <div class="branding-grid">
              <div class="drop-zone" [class.hover]="logoHover" [class.error]="brandingError === 'logo'" (dragover)="onDragOver($event, 'logo')" (dragleave)="onDragLeave('logo')" (drop)="onDrop($event, 'logo')">
                <div class="logo-preview" [class.has-image]="logoPreview">
                  <div class="progress-bar" *ngIf="logoProgress > 0 && logoProgress < 100">
                    <div class="progress-fill" [style.width.%]="logoProgress"></div>
                  </div>
                  <div class="status-badge success" *ngIf="logoSuccess">✔ Updated</div>
                  <ng-container *ngIf="logoPreview; else logoInitials">
                    <img [src]="logoPreview" alt="Logo preview">
                  </ng-container>
                  <ng-template #logoInitials>
                    <span>{{ initials }}</span>
                  </ng-template>
                </div>
                <div class="drop-text">
                  <strong>Logo</strong>
                  <span>PNG/SVG, max 1MB</span>
                </div>
                <input type="file" accept="image/*" (change)="onFileSelect($event, 'logo')" hidden #logoInput>
                <button type="button" class="btn ghost tiny" (click)="logoInput.click()">Upload</button>
              </div>

              <div class="drop-zone small" [class.hover]="faviconHover" [class.error]="brandingError === 'favicon'" (dragover)="onDragOver($event, 'favicon')" (dragleave)="onDragLeave('favicon')" (drop)="onDrop($event, 'favicon')">
                <div class="favicon-preview" [class.has-image]="faviconPreview">
                  <div class="progress-bar" *ngIf="faviconProgress > 0 && faviconProgress < 100">
                    <div class="progress-fill" [style.width.%]="faviconProgress"></div>
                  </div>
                  <div class="status-badge success" *ngIf="faviconSuccess">✔</div>
                  <ng-container *ngIf="faviconPreview; else faviconFallback">
                    <img [src]="faviconPreview" alt="Favicon preview">
                  </ng-container>
                  <ng-template #faviconFallback>
                    <span>{{ faviconInitial }}</span>
                  </ng-template>
                </div>
                <div class="drop-text">
                  <strong>Favicon</strong>
                  <span>32x32</span>
                </div>
                <input type="file" accept="image/*" (change)="onFileSelect($event, 'favicon')" hidden #faviconInput>
                <button type="button" class="btn ghost tiny" (click)="faviconInput.click()">Upload</button>
              </div>
            </div>
          </div>

          <h3><span class="icon">🎓</span> School Profile</h3>
          <div class="profile-block">
            <div class="field-grid">
              <div class="field full">
                <div class="label-row">
                  <label>School Name <span class="required">*</span></label>
                </div>
                <div class="input-icon-row">
                  <span class="input-icon" aria-hidden="true">🏫</span>
                  <input [(ngModel)]="model.schoolName" required placeholder="School name" />
                </div>
              </div>
              <div class="field compact">
                <div class="label-row">
                  <label>Domain <span class="required">*</span></label>
                </div>
                <div class="input-icon-row with-action" [class.error-input]="domainStatus === 'invalid'">
                <span class="input-icon" aria-hidden="true">🌐</span>
                  <input [(ngModel)]="model.domain" placeholder="myschool.edu" (ngModelChange)="onDomainChange($event)" />
                  <span class="status-icon success" *ngIf="domainStatus === 'valid'">✔</span>
                  <span class="status-icon error" *ngIf="domainStatus === 'invalid'">✕</span>
                  <button type="button" class="icon-btn" (click)="copyValue(model.domain || '')" [disabled]="!model.domain">
                    <span *ngIf="copiedKey === 'domain'">✔</span>
                  </button>
                </div>
                <p class="help small">Use your public domain (no protocol). This appears on emails and reports.</p>
              </div>
              <div class="field compact">
                <div class="label-row">
                  <label>Website</label>
                  <span class="optional muted">(Optional)</span>
                </div>
                <div class="input-icon-row">
                  <span class="input-icon" aria-hidden="true">🔗</span>
                  <div class="prefix-input">
                    <span class="prefix muted">https://www.</span>
                    <input [(ngModel)]="websiteTail" placeholder="your-site.com" />
                  </div>
                </div>
                <p class="help small">We’ll display this on external-facing documents.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div class="section-actions" *ngIf="tab === 'profile'">
        <button class="btn primary" (click)="saveProfile()" [disabled]="saving">Save Profile</button>
      </div>

      <div class="grid" *ngIf="tab === 'contact'">
        <section class="card flat">
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

        <section class="card flat">
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
        <button class="btn primary" (click)="saveContact()" [disabled]="saving">Save Contact</button>
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

        <section class="card soft">
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

        <section class="card soft">
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

        <section class="card soft">
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
        <button class="btn primary" (click)="saveAcademics()" [disabled]="saving">Save Academics</button>
      </div>

      <div class="grid" *ngIf="tab === 'grading'">
        <section class="card flat">
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
        <button class="btn primary" (click)="saveGrading()" [disabled]="saving">Save Grading</button>
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
    .page { padding:1.35rem; display:flex; flex-direction:column; gap:1.15rem; background: color-mix(in srgb, var(--color-surface, #0f172a) 88%, var(--color-background, #f7f9fc) 12%); color: var(--color-text-primary); border: none; border-radius: 16px; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; }
    .eyebrow { text-transform:uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.15rem; font-size: 0.8rem; }
    h1 { margin:0 0 0.25rem; color: var(--color-text-primary); letter-spacing:-0.01em; font-weight:800; }
    .sub { margin:0; color: var(--color-text-secondary); line-height:1.45; }
    .btn { border-radius:12px; border:1px solid color-mix(in srgb, var(--color-border) 50%, transparent); padding:0.7rem 1.15rem; font-weight:650; cursor:pointer; background: color-mix(in srgb, var(--color-surface) 85%, var(--color-surface-hover) 15%); color: var(--color-text-primary); transition: all 0.2s ease; box-shadow: 0 10px 22px rgba(0,0,0,0.18); }
    .btn.primary { background: linear-gradient(135deg, #f6c344, #f2a811); color: var(--color-surface, #0f0f12); border:none; box-shadow: 0 16px 34px rgba(242, 168, 17, 0.42); }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 14px 26px rgba(0,0,0,0.24); }
    .btn.tiny { padding: 0.35rem 0.6rem; font-size: 0.85rem; box-shadow: none; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap:0.85rem 1.2rem; padding-bottom: 0.25rem; }
    .tabs { display:flex; gap:0.4rem; margin-top:0.35rem; }
    .tabs.segmented { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); background: color-mix(in srgb, var(--color-surface-hover) 85%, var(--color-surface) 15%); border:1px solid color-mix(in srgb, var(--color-border) 55%, transparent); padding:0.35rem; border-radius: 16px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.04); gap:0.2rem; overflow: hidden; }
    .tabs.segmented::before { content: ''; position: absolute; top: 6px; bottom: 6px; width: calc(100% / 4 - 8px); left: calc((100% / 4) * var(--active-index, 0) + 4px); background: color-mix(in srgb, var(--color-surface) 85%, var(--color-primary, #00c4cc) 15%); border-radius: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.2); transition: all 0.22s ease-out; }
    .tab { padding:0.6rem 0.95rem; border-radius:10px; border:none; background: transparent; cursor:pointer; font-weight:650; color: var(--color-text-secondary); transition: color 0.2s ease; position: relative; z-index: 1; }
    .tab.active { color: var(--color-text-primary); font-weight:700; }
    .tab:hover:not(.active) { color: var(--color-text-primary); }
    .card { background: color-mix(in srgb, var(--color-surface) 88%, var(--color-surface-hover) 12%); border:none; border-radius:14px; padding:1.15rem; box-shadow: 0 12px 28px rgba(0,0,0,0.16); display:flex; flex-direction:column; gap:0.5rem; }
    .card.flat { background: transparent; box-shadow: none; padding: 0; }
    .card.soft { background: color-mix(in srgb, var(--color-surface) 90%, var(--color-surface-hover) 10%); box-shadow: 0 10px 22px rgba(0,0,0,0.12); }
    .card h3 { margin:0 0 0.3rem; color: var(--color-text-primary); letter-spacing:-0.01em; font-size:1.05rem; display: inline-flex; align-items: center; gap: 0.4rem; }
    .card .icon { margin-right:0.35rem; filter: grayscale(0); color: var(--color-primary, #00c4cc); }
    .branding-card { background: color-mix(in srgb, var(--color-surface) 90%, var(--color-surface-hover) 10%); border-radius: 14px; padding: 0.9rem 1rem; box-shadow: 0 10px 24px rgba(0,0,0,0.14); margin-bottom: 0.4rem; display: flex; flex-direction: column; gap: 0.75rem; transition: box-shadow 0.2s ease, border-color 0.2s ease; }
    .branding-header { display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem; }
    .branding-title { margin: 0; font-size: 1.05rem; letter-spacing: -0.01em; }
    .branding-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 0.75rem; }
    .drop-zone { border: 1px dashed color-mix(in srgb, var(--color-border) 60%, transparent); border-radius: 12px; padding: 0.85rem; background: color-mix(in srgb, var(--color-surface) 92%, var(--color-surface-hover) 8%); display: flex; align-items: center; gap: 0.65rem; transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease; }
    .drop-zone.hover { border-color: var(--color-primary, #00c4cc); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #00c4cc) 30%, transparent); transform: translateY(-1px); }
    .drop-zone.error { border-color: var(--color-error, #ef4444); box-shadow: 0 0 0 3px rgba(var(--color-error-rgb,239,68,68),0.3); }
    .drop-zone.small { max-width: 240px; }
    .logo-preview, .favicon-preview { position: relative; width: 64px; height: 64px; border-radius: 14px; background: color-mix(in srgb, var(--color-surface-hover) 85%, var(--color-surface) 15%); display: grid; place-items: center; font-weight: 800; color: var(--color-text-primary); overflow: hidden; }
    .logo-preview.has-image img, .favicon-preview.has-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .favicon-preview { width: 42px; height: 42px; border-radius: 10px; font-size: 0.9rem; }
    .drop-text { display:flex; flex-direction:column; gap:0.15rem; color: var(--color-text-secondary); flex:1; }
    .drop-text strong { color: var(--color-text-primary); }
    .progress-bar { position:absolute; top:0; left:0; right:0; height: 6px; background: rgba(255,255,255,0.08); }
    .progress-fill { height: 100%; background: linear-gradient(90deg, var(--color-primary, #00c4cc), color-mix(in srgb, var(--color-primary, #00c4cc) 70%, #fff)); }
    .status-badge { position:absolute; bottom:6px; right:6px; font-size: 0.7rem; padding: 4px 6px; border-radius: 8px; background: color-mix(in srgb, var(--color-surface-hover) 80%, var(--color-surface) 20%); box-shadow: 0 6px 12px rgba(0,0,0,0.18); }
    .status-badge.success { color: var(--color-success, #16a34a); }
    .profile-block { background: color-mix(in srgb, var(--color-surface) 85%, var(--color-surface-hover) 15%); border-radius: 14px; padding: 0.9rem; box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 10px 22px rgba(0,0,0,0.12); }
    .field-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(260px,1fr)); gap: 0.85rem 1.1rem; align-items: flex-start; }
    .field { display:flex; flex-direction:column; gap:0.35rem; }
    .field.compact { max-width: 420px; }
    .field.full { grid-column: 1 / -1; }
    .label-row { display:flex; align-items:center; gap:0.5rem; }
    label { display:inline-flex; align-items:center; gap:0.25rem; font-weight:600; color: var(--color-text-secondary); letter-spacing: 0.01em; font-size: 0.82rem; transition: color 0.18s ease; }
    .optional { font-size: 0.78rem; }
    .required { color: var(--color-primary, #00c4cc); font-weight: 700; }
    input, select {
      border:1px solid color-mix(in srgb, var(--color-border) 55%, transparent);
      border-radius:10px;
      padding:0.6rem 0.75rem 0.6rem 2.3rem;
      background: color-mix(in srgb, var(--color-background) 92%, var(--color-surface-hover) 8%);
      color: var(--color-text-primary);
      transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
      font-size: 0.95rem;
      font-weight: 500;
      min-height: 46px;
    }
    input::placeholder, select::placeholder { color: var(--color-text-secondary); }
    input:focus, select:focus {
      outline:none;
      border-color: var(--color-primary, #00c4cc);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #00c4cc) 28%, transparent);
      background: color-mix(in srgb, var(--color-surface-hover) 70%, var(--color-background) 30%);
    }
    label:focus-within { color: var(--color-primary, #00c4cc); }
    .prefix-input { display:flex; align-items:center; gap:0.35rem; width:100%; border:1px solid color-mix(in srgb, var(--color-border) 55%, transparent); border-radius:10px; padding-right: 0.35rem; background: color-mix(in srgb, var(--color-background) 92%, var(--color-surface-hover) 8%); padding-left: 2.3rem; transition: border-color 0.18s ease, box-shadow 0.18s ease; min-height: 46px; }
    .prefix-input .prefix { padding-left: 0.75rem; color: var(--color-text-tertiary); font-size: 0.9rem; }
    .prefix-input input { border:none !important; box-shadow:none !important; background: transparent; padding:0.6rem 0.4rem; padding-left: 0.4rem !important; flex:1; font-size:0.95rem; font-weight:500; }
    .prefix-input input:focus { box-shadow:none; outline:none; padding-left: 0.4rem !important; }
    .prefix-input:focus-within { border-color: var(--color-primary, #00c4cc); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #00c4cc) 28%, transparent); }
    .split { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:0.5rem; align-items:end; }
    .split.equal label { width: 100%; }
    .list { display:flex; gap:0.35rem; align-items:center; flex-wrap:wrap; }
    .chip { border:1px solid color-mix(in srgb, var(--color-border) 50%, transparent); border-radius:10px; padding:0.45rem 0.75rem; background: color-mix(in srgb, var(--color-surface-hover) 80%, var(--color-surface) 20%); cursor:pointer; }
    .chip.danger { border-color: rgba(var(--color-error-rgb,239,68,68),0.3); color: var(--color-error,#ef4444); }
    .section-actions { display:flex; gap:0.75rem; align-items:center; position: sticky; bottom: 0; background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--color-surface) 75%, var(--color-surface-hover) 25%)); padding-top: 1.25rem; margin-top: 2rem; }
    .footer-actions { display:flex; align-items:center; gap:0.75rem; }
    .muted { color: var(--color-text-secondary); }
    .tiny { font-size: 0.8rem; line-height: 1.3; }
    .error { color: var(--color-error,#ef4444); font-weight:600; }
    .card-header { display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-bottom:0.25rem; }
    .table { width:100%; border-collapse:separate; border-spacing:0 6px; font-size:0.95rem; background: transparent; color: var(--color-text-primary); }
    .table th, .table td { text-align:left; padding:0.6rem 0.65rem; background: color-mix(in srgb, var(--color-surface) 90%, var(--color-surface-hover) 10%); }
    .table th { color: var(--color-text-secondary); font-weight:700; text-transform:uppercase; font-size:0.8rem; letter-spacing:0.04em; background: transparent; }
    .table tbody tr td:first-child, .table thead tr th:first-child { border-top-left-radius: 10px; border-bottom-left-radius: 10px; }
    .table tbody tr td:last-child, .table thead tr th:last-child { border-top-right-radius: 10px; border-bottom-right-radius: 10px; }
    .table tbody tr:hover td { box-shadow: 0 10px 18px rgba(0,0,0,0.1); }
    .input-icon-row { position: relative; display:flex; align-items:center; min-height: 46px; }
    .input-icon { position:absolute; left: 0.65rem; top: 50%; transform: translateY(-50%); color: var(--color-text-tertiary); transition: color 0.18s ease, transform 0.18s ease; pointer-events: none; display: inline-flex; align-items: center; }
    .input-icon-row:focus-within .input-icon { color: var(--color-primary, #00c4cc); transform: translate(1px, -50%); }
    .input-icon-row input,
    .input-icon-row .prefix-input { min-height: 46px; }
    .input-icon-row input { padding-left: 2.3rem; }
    .input-icon-row.with-action input { padding-right: 3rem; }
    .icon-btn { position:absolute; right: 0.5rem; background: transparent; border: none; color: var(--color-text-tertiary); cursor: pointer; font-size: 0.95rem; transition: color 0.15s ease, transform 0.15s ease; }
    .icon-btn:hover { color: var(--color-primary, #00c4cc); transform: translateY(-1px); }
    .help { margin: 2px 0 0; color: var(--color-text-tertiary); font-size: 0.78rem; line-height: 1.4; }
    .help.small { font-size: 0.7rem; }
    .empty { text-align:center; color: var(--color-text-secondary); padding:0.75rem 0; background: transparent; }
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:50; }
    .modal { background: color-mix(in srgb, var(--color-surface) 90%, var(--color-surface-hover) 10%); border-radius:14px; padding:1.25rem; width:min(480px, 90vw); border:none; box-shadow: 0 20px 48px rgba(0,0,0,0.35); }
    .modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
    .form-stack { display:flex; flex-direction:column; gap:0.55rem; }
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
      domain: '',
      website: '',
      logoUrl: '',
      faviconUrl: '',
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
  get activeTabIndex(): number {
    const order: Array<typeof this.tab> = ['profile', 'academics', 'contact', 'grading'];
    return Math.max(0, order.indexOf(this.tab));
  }

  newDept = { name: '', code: '' };
  newGrade = { name: '', code: '', level: '' };
  newSubject = { name: '', code: '' };
  activeModal: 'dept' | 'grade' | 'subject' | null = null;
  logoPreview: string | null = null;
  faviconPreview: string | null = null;
  logoHover = false;
  faviconHover = false;
  brandingError: 'logo' | 'favicon' | null = null;
  logoProgress = 0;
  faviconProgress = 0;
  logoSuccess = false;
  faviconSuccess = false;
  copiedKey: 'domain' | null = null;
  websiteTail = '';
  get faviconInitial(): string {
    return (this.initials || 'M').slice(0, 1);
  }
  domainStatus: 'idle' | 'validating' | 'valid' | 'invalid' = 'idle';
  private domainCheckTimer: any = null;

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

      if (data.logoUrl) {
        this.model.logoUrl = data.logoUrl;
        this.logoPreview = data.logoUrl;
      }
      if (data.faviconUrl) {
        this.model.faviconUrl = data.faviconUrl;
        this.faviconPreview = data.faviconUrl;
      }

      if (data.website) {
        this.websiteTail = this.stripUrlPrefix(data.website);
      }
    });
  }

  saveProfile() {
    this.saving = true;
    this.saved = false;
    this.saveError = '';
    const website = this.websiteTail ? `https://www.${this.websiteTail}` : this.model.website;
    this.model.website = website || this.model.website;
    const payload: Partial<SchoolSettings> = this.cleanPayload({
      schoolName: this.model.schoolName,
      domain: this.model.domain,
      website,
      logoUrl: this.model.logoUrl,
      faviconUrl: this.model.faviconUrl
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
      faviconUrl: this.model.faviconUrl,
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

  onFileSelect(event: any, type: 'logo' | 'favicon') {
    const file = event.target.files?.[0];
    if (file) this.readFile(file, type);
  }

  onDragOver(event: DragEvent, type: 'logo' | 'favicon') {
    event.preventDefault();
    if (type === 'logo') this.logoHover = true; else this.faviconHover = true;
  }

  onDragLeave(type: 'logo' | 'favicon') {
    if (type === 'logo') this.logoHover = false; else this.faviconHover = false;
    if (this.brandingError === type) this.brandingError = null;
  }

  onDrop(event: DragEvent, type: 'logo' | 'favicon') {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.readFile(file, type);
    this.onDragLeave(type);
  }

  copyValue(value: string) {
    if (!value || !navigator?.clipboard) return;
    navigator.clipboard.writeText(value).then(() => {
      this.copiedKey = 'domain';
      setTimeout(() => { this.copiedKey = null; }, 1200);
    }).catch(() => { this.copiedKey = null; });
  }

  get initials(): string {
    const name = this.model.schoolName || 'School';
    return name
      .split(' ')
      .filter(Boolean)
      .map(p => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('') || 'MB';
  }

  private readFile(file: File, type: 'logo' | 'favicon') {
    if (!file.type.startsWith('image/')) {
      this.brandingError = type;
      setTimeout(() => { if (this.brandingError === type) this.brandingError = null; }, 1200);
      return;
    }
    if (type === 'logo') { this.logoProgress = 5; this.logoSuccess = false; }
    else { this.faviconProgress = 5; this.faviconSuccess = false; }
    this.brandingError = null;

    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'logo') {
        this.logoPreview = reader.result as string;
      } else {
        this.faviconPreview = reader.result as string;
      }
    };
    reader.readAsDataURL(file);

    this.settingsService.uploadAsset(type, file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total || file.size || 1;
          const progress = Math.round((event.loaded / total) * 100);
          if (type === 'logo') this.logoProgress = progress;
          else this.faviconProgress = progress;
        } else if (event.type === HttpEventType.Response) {
          const url = event.body?.url || event.body?.key || null;
          if (type === 'logo') {
            this.model.logoUrl = url || this.model.logoUrl;
            if (url) this.logoPreview = url;
            this.logoProgress = 100;
            this.logoSuccess = true;
            setTimeout(() => { this.logoSuccess = false; this.logoProgress = 0; }, 1200);
          } else {
            this.model.faviconUrl = url || this.model.faviconUrl;
            if (url) this.faviconPreview = url;
            this.faviconProgress = 100;
            this.faviconSuccess = true;
            setTimeout(() => { this.faviconSuccess = false; this.faviconProgress = 0; }, 1200);
          }
        }
      },
      error: () => {
        this.brandingError = type;
        if (type === 'logo') {
          this.logoProgress = 0;
          this.logoSuccess = false;
        } else {
          this.faviconProgress = 0;
          this.faviconSuccess = false;
        }
        setTimeout(() => { if (this.brandingError === type) this.brandingError = null; }, 1500);
      }
    });
  }

  private stripUrlPrefix(url: string): string {
    return url.replace(/^https?:\/\/(www\.)?/, '');
  }

  onDomainChange(value: string) {
    if (this.domainCheckTimer) clearTimeout(this.domainCheckTimer);
    this.domainStatus = 'validating';
    this.domainCheckTimer = setTimeout(() => {
      const isValid = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value || '');
      if (!isValid) {
        this.domainStatus = 'invalid';
        return;
      }
      this.domainStatus = 'valid';
    }, 500);
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
