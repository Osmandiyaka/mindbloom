import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { WalkInService } from '../../../../core/services/walkin.service';

@Component({
  selector: 'app-walk-in-new',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <section class="page-shell">
      <header class="page-header">
        <div>
          <p class="eyebrow">Admissions · Walk-in</p>
          <h2>New Walk-in Admission</h2>
          <p class="muted">Collect details, documents, assign class, and capture payment.</p>
        </div>
        <div class="actions">
          <button class="btn ghost" type="button" (click)="reset()">Reset</button>
        </div>
      </header>

      <div class="stepper">
        <div *ngFor="let step of steps; let i = index" class="step" [class.active]="currentStep() === i" [class.done]="i < currentStep()">
          <div class="circle">{{ i + 1 }}</div>
          <div>
            <div class="label">{{ step.label }}</div>
            <div class="muted small">{{ step.desc }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <ng-container [ngSwitch]="currentStep()">
          <!-- Step 1: Basic Info -->
          <div *ngSwitchCase="0" class="grid two">
            <label>
              Student Name
              <input [(ngModel)]="form.basic.name" placeholder="Student full name" />
            </label>
            <label>
              Grade Applying
              <select [(ngModel)]="form.basic.grade">
                <option *ngFor="let grade of grades" [value]="grade">{{ grade }}</option>
              </select>
            </label>
            <label>
              Parent Name
              <input [(ngModel)]="form.basic.parentName" placeholder="Parent/Guardian" />
            </label>
            <label>
              Parent Contact
              <input [(ngModel)]="form.basic.parentContact" placeholder="+234..." />
            </label>
            <label class="full">
              Reason (optional)
              <textarea [(ngModel)]="form.basic.reason" rows="2" placeholder="Reason for direct admission"></textarea>
            </label>
          </div>

          <!-- Step 2: Documents -->
          <div *ngSwitchCase="1" class="checklist">
            <label *ngFor="let doc of documents">
              <input type="checkbox" [(ngModel)]="doc.received" />
              <span>
                <strong>{{ doc.label }}</strong>
                <span class="muted small">{{ doc.note }}</span>
              </span>
            </label>
            <p class="muted small">You can proceed even if some documents are pending.</p>
          </div>

          <!-- Step 3: Class Assignment -->
          <div *ngSwitchCase="2" class="grid two">
            <label>
              Class
              <select [(ngModel)]="form.assignment.className">
                <option *ngFor="let cls of classes" [value]="cls.name">{{ cls.name }} ({{ cls.section }})</option>
              </select>
            </label>
            <label>
              Section
              <select [(ngModel)]="form.assignment.section">
                <option *ngFor="let section of sections" [value]="section">{{ section }}</option>
              </select>
            </label>
            <div class="full seat-info">
              <p class="muted">Seat availability</p>
              <div class="availability">
                <div *ngFor="let cls of classes">
                  <div class="strong">{{ cls.name }} · {{ cls.section }}</div>
                  <div class="muted small">{{ cls.available }} of {{ cls.capacity }} seats left</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: Payment -->
          <div *ngSwitchCase="3" class="grid two">
            <label>
              Fee Plan
              <select [(ngModel)]="form.payment.plan">
                <option *ngFor="let plan of feePlans" [value]="plan.code">{{ plan.name }} (₦{{ plan.amount }})</option>
              </select>
            </label>
            <label>
              Payment Mode
              <select [(ngModel)]="form.payment.mode">
                <option *ngFor="let mode of modes" [value]="mode">{{ mode | titlecase }}</option>
              </select>
            </label>
            <label>
              Amount
              <input type="number" [(ngModel)]="form.payment.amount" placeholder="e.g. 25000" />
            </label>
            <label>
              Reference (optional)
              <input [(ngModel)]="form.payment.reference" placeholder="Txn reference" />
            </label>
            <div class="full summary">
              <div>Plan: <strong>{{ selectedPlan()?.name || 'N/A' }}</strong></div>
              <div>Total: <strong>₦{{ selectedPlan()?.amount || form.payment.amount || 0 }}</strong></div>
            </div>
          </div>

          <!-- Step 5: Completion -->
          <div *ngSwitchCase="4" class="completion">
            <div class="check">✔</div>
            <h3>Admission drafted</h3>
            <p class="muted">This mock flow shows the final step. Hook it to your API to persist.</p>
            <div class="summary-box">
              <div><strong>{{ form.basic.name }}</strong> · {{ form.basic.grade }}</div>
              <div>Parent: {{ form.basic.parentName }} · {{ form.basic.parentContact }}</div>
              <div>Payment: ₦{{ form.payment.amount || selectedPlan()?.amount || '0' }} via {{ form.payment.mode }}</div>
            </div>
          </div>
        </ng-container>
      </div>

      <footer class="wizard-footer">
        <button class="btn ghost" type="button" [disabled]="currentStep() === 0" (click)="prev()">Back</button>
        <div class="spacer"></div>
        <button class="btn ghost" type="button" *ngIf="currentStep() < steps.length - 1" (click)="saveDraft()">Save draft</button>
        <button class="btn primary" type="button" *ngIf="currentStep() < steps.length - 1" (click)="next()">Next</button>
        <button class="btn primary" type="button" *ngIf="currentStep() === steps.length - 1" (click)="complete()">Finish & receipt</button>
      </footer>
    </section>
  `,
  styles: [`
    .page-shell { padding: 1rem 1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap; }
    .eyebrow { text-transform:uppercase; letter-spacing:0.08em; margin:0; font-size:12px; color:var(--color-text-secondary); }
    h2 { margin: 0 0 0.35rem; }
    .muted { color: var(--color-text-secondary); margin: 0; }
    .muted.small { font-size: 0.9rem; }
    .actions { display:flex; gap:0.5rem; }
    .btn { border:1px solid var(--color-border); border-radius:10px; padding:0.65rem 1rem; background:var(--color-surface); color:var(--color-text-primary); cursor:pointer; font-weight:700; }
    .btn.ghost { background:transparent; }
    .btn.primary { background:linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow:0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.35); }

    .stepper { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; }
    .step { display:flex; gap:0.75rem; padding:0.75rem; border:1px solid var(--color-border); border-radius:12px; background:var(--color-surface); align-items:flex-start; }
    .step .circle { width:32px; height:32px; border-radius:50%; display:grid; place-items:center; background:var(--color-surface-hover); color:var(--color-text-primary); font-weight:700; }
    .step.active { border-color: rgba(var(--color-primary-rgb,123,140,255),0.6); box-shadow:0 8px 20px rgba(var(--color-primary-rgb,123,140,255),0.25); }
    .step.done .circle { background:linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; }
    .label { font-weight:700; color:var(--color-text-primary); }

    .card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:14px; padding:1rem 1.1rem; box-shadow:var(--shadow-sm); }
    .grid { display:grid; gap:0.8rem; }
    .grid.two { grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); }
    label { display:flex; flex-direction:column; gap:0.35rem; font-weight:600; color:var(--color-text-primary); }
    input, select, textarea { border:1px solid var(--color-border); border-radius:10px; background:var(--color-surface-hover); padding:0.55rem 0.65rem; color:var(--color-text-primary); }
    .full { grid-column: 1 / -1; }

    .checklist { display:flex; flex-direction:column; gap:0.65rem; }
    .checklist label { flex-direction:row; align-items:flex-start; gap:0.55rem; font-weight:600; }
    .checklist input { width:18px; height:18px; margin-top:0.25rem; }

    .seat-info { background:var(--color-surface-hover); padding:0.75rem; border-radius:12px; border:1px solid var(--color-border); }
    .availability { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:0.5rem; }

    .summary { display:flex; gap:1rem; flex-wrap:wrap; padding:0.75rem; border-radius:10px; background:var(--color-surface-hover); border:1px dashed var(--color-border); }

    .completion { display:flex; flex-direction:column; align-items:center; gap:0.75rem; text-align:center; }
    .completion .check { width:48px; height:48px; border-radius:50%; background:rgba(var(--color-success-rgb,16,185,129),0.2); color:var(--color-success,#10b981); display:grid; place-items:center; font-size:1.4rem; }
    .summary-box { padding:0.9rem 1rem; border-radius:12px; border:1px solid var(--color-border); background:var(--color-surface-hover); display:flex; flex-direction:column; gap:0.35rem; }

    .wizard-footer { display:flex; align-items:center; gap:0.6rem; }
    .spacer { flex:1; }

    @media (max-width: 768px) {
      .layout { grid-template-columns: 1fr; }
    }
  `]
})
export class WalkInNewComponent {
  steps = [
    { label: 'Basic Info', desc: 'Student and parent details' },
    { label: 'Documents', desc: 'Collect key documents' },
    { label: 'Class Assignment', desc: 'Assign class and section' },
    { label: 'Payment', desc: 'Capture plan and payment' },
    { label: 'Completion', desc: 'Review summary' },
  ];
  currentStep = signal(0);

  grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 6', 'Grade 7', 'Grade 8'];
  documents = [
    { label: 'Birth Certificate', note: 'Original or certified copy', received: false },
    { label: 'Previous School TC', note: 'Transfer certificate', received: false },
    { label: 'Report Cards', note: 'Last two terms', received: false },
    { label: 'Aadhar/ID', note: 'Government ID', received: false },
    { label: 'Photos', note: 'Two passport photos', received: false },
  ];
  classes = [
    { name: 'Class A', section: 'Blue', capacity: 30, available: 6 },
    { name: 'Class B', section: 'Green', capacity: 28, available: 3 },
  ];
  sections = ['Blue', 'Green', 'Red'];
  feePlans = [
    { code: 'STD', name: 'Standard', amount: 25000 },
    { code: 'PREM', name: 'Premium', amount: 40000 },
  ];
  modes = ['cash', 'card', 'online', 'cheque'];

  form = {
    basic: { name: '', grade: this.grades[0], parentName: '', parentContact: '', reason: '' },
    assignment: { className: this.classes[0].name, section: this.sections[0] },
    payment: { plan: this.feePlans[0].code, mode: this.modes[0], amount: this.feePlans[0].amount, reference: '' },
  };

  constructor(private readonly walkIns: WalkInService, private readonly router: Router) {}

  selectedPlan() {
    return this.feePlans.find(p => p.code === this.form.payment.plan);
  }

  next() {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update(v => v + 1);
    }
  }

  prev() {
    if (this.currentStep() > 0) {
      this.currentStep.update(v => v - 1);
    }
  }

  saveDraft() {
    this.next();
  }

  reset() {
    this.currentStep.set(0);
    this.form = {
      basic: { name: '', grade: this.grades[0], parentName: '', parentContact: '', reason: '' },
      assignment: { className: this.classes[0].name, section: this.sections[0] },
      payment: { plan: this.feePlans[0].code, mode: this.modes[0], amount: this.feePlans[0].amount, reference: '' },
    };
    this.documents.forEach(d => d.received = false);
  }

  complete() {
    const record = this.walkIns.upsert({
      basic: { ...this.form.basic },
      assignment: { ...this.form.assignment },
      payment: { ...this.form.payment },
    });
    this.router.navigate(['/admissions/walk-in/receipt', record.id]);
  }
}
