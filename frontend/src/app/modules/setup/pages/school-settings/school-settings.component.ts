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
          <p class="sub">Define school profile, academic year, locale, and contact details.</p>
        </div>
        <button class="btn primary" (click)="save()" [disabled]="saving">Save Settings</button>
      </header>

      <div class="grid">
        <section class="card">
          <h3>School Profile</h3>
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

        <section class="card">
          <h3>Contact</h3>
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
          <h3>Address</h3>
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

        <section class="card">
          <h3>Locale & Academic Year</h3>
          <label>Timezone
            <input [(ngModel)]="model.timezone" placeholder="America/New_York" />
          </label>
          <label>Locale
            <input [(ngModel)]="model.locale" placeholder="en-US" />
          </label>
          <div class="split">
            <label>Academic Year Start
              <input type="date" [(ngModel)]="model.academicYear.start" />
            </label>
            <label>Academic Year End
              <input type="date" [(ngModel)]="model.academicYear.end" />
            </label>
          </div>
        </section>

        <section class="card">
          <h3>Grading Scheme</h3>
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
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap:1rem; }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1.25rem; box-shadow: var(--shadow-sm); display:flex; flex-direction:column; gap:0.65rem; }
    .card h3 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    input, select { border:1px solid var(--color-border); border-radius:8px; padding:0.65rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .split { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:0.5rem; }
    .footer-actions { display:flex; align-items:center; gap:0.75rem; }
    .muted { color: var(--color-text-secondary); }
  `]
})
export class SchoolSettingsComponent implements OnInit {
  model: SchoolSettings & {
    academicYear: { start: string; end: string };
    gradingScheme: { type: string; passThreshold: number };
  } = {
      schoolName: '',
      academicYear: { start: '', end: '' },
      gradingScheme: { type: 'Percentage', passThreshold: 40 }
    };
  saving = false;
  saved = false;

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
        }
      };
    });
  }

  save() {
    this.saving = true;
    this.saved = false;
    this.settingsService.save(this.model).subscribe(() => {
      this.saving = false;
      this.saved = true;
    }, () => {
      this.saving = false;
    });
  }
}
