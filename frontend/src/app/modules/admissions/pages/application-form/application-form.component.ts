import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdmissionsService } from '../../../../core/services/admissions.service';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="application-form">
      <div class="form-card">
        <p class="eyebrow">Admissions</p>
        <h1>New Application</h1>
        <p class="sub">Collect applicant information and required documents.</p>

        <div *ngIf="admissions.error()" class="alert">{{ admissions.error() }}</div>

        <form (ngSubmit)="submit()" #form="ngForm">
          <div class="grid">
            <label>
              Applicant Name
              <input name="name" [(ngModel)]="model.applicantName" required placeholder="Full name" />
            </label>
            <label>
              Grade Applying
              <input name="grade" [(ngModel)]="model.gradeApplying" required placeholder="e.g., Grade 7" />
            </label>
            <label>
              Email
              <input type="email" name="email" [(ngModel)]="model.email" required placeholder="parent@email.com" />
            </label>
            <label>
              Phone
              <input name="phone" [(ngModel)]="model.phone" required placeholder="+1 555-123-4567" />
            </label>
          </div>

          <label>
            Notes
            <textarea name="notes" [(ngModel)]="model.notes" rows="3" placeholder="Special considerations"></textarea>
          </label>

          <label class="upload">
            Upload Documents
            <input type="file" multiple (change)="onFiles($event)" />
          </label>

          <div class="actions">
            <button type="button" class="btn ghost" (click)="cancel()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!form.valid">Submit Application</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .application-form { padding:1.5rem; display:flex; justify-content:center; }
    .form-card { width: min(900px, 100%); background: var(--color-surface); border:1px solid var(--color-border); border-radius:16px; padding:1.75rem; box-shadow: var(--shadow-lg); }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.35rem; }
    h1 { margin:0 0 0.4rem; color: var(--color-text-primary); }
    .sub { margin:0 0 1.25rem; color: var(--color-text-secondary); }
    form { display:flex; flex-direction:column; gap:1rem; }
    label { display:flex; flex-direction:column; gap:0.35rem; color: var(--color-text-primary); font-weight:600; }
    input, textarea { border:1px solid var(--color-border); border-radius:10px; padding:0.75rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    textarea { resize: vertical; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:1rem; }
    .upload input { padding:0.5rem 0; }
    .actions { display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem; }
    .btn { border:none; border-radius:10px; padding:0.75rem 1.2rem; font-weight:600; cursor:pointer; }
    .btn.ghost { background: transparent; border:1px solid var(--color-border); color: var(--color-text-primary); }
    .btn-primary { background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary)); color:var(--color-background, #0f172a); box-shadow: var(--shadow-md, 0 10px 24px rgba(0,0,0,0.22)); }
    .alert { padding:0.75rem 1rem; border-radius:10px; background: color-mix(in srgb, var(--color-error) 10%, transparent); border:1px solid color-mix(in srgb, var(--color-error) 30%, transparent); color: var(--color-error); margin-bottom:0.75rem; }
  `]
})
export class ApplicationFormComponent {
  model = {
    applicantName: '',
    gradeApplying: '',
    email: '',
    phone: '',
    notes: '',
    documents: [] as { name: string; type: string }[]
  };

  constructor(public admissions: AdmissionsService, private router: Router) { }

  onFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const docs = Array.from(input.files).map(f => ({ name: f.name, type: f.type || 'document' }));
    this.model.documents = [...this.model.documents, ...docs];
  }

  submit() {
    this.admissions.createApplication({
      applicantName: this.model.applicantName,
      gradeApplying: this.model.gradeApplying,
      email: this.model.email,
      phone: this.model.phone,
      notes: this.model.notes,
      documents: this.model.documents,
    }).subscribe(result => {
      if (result) {
        this.router.navigate(['/admissions']);
      }
    });
  }

  cancel() {
    this.router.navigate(['/admissions']);
  }
}
