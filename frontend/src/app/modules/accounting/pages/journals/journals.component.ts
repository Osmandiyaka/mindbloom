import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AccountingService, AccountNode } from '../../../../core/services/accounting.service';

@Component({
  selector: 'app-journals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page">
      <nav class="breadcrumbs">
        <a routerLink="/accounting">Accounting</a>
        <span class="sep">/</span>
        <span>Journals</span>
      </nav>
      <header class="page-header">
        <div>
          <p class="eyebrow">Accounting</p>
          <h1>Post Journal Entry</h1>
          <p class="sub">Balanced debit/credit entry with memo and source tracking.</p>
        </div>
      </header>

      <section class="card">
        <form (ngSubmit)="post()">
          <div class="form-grid">
            <label>Date
              <input type="date" [(ngModel)]="form.date" name="date" required />
            </label>
            <label>Reference
              <input [(ngModel)]="form.refNo" name="refNo" placeholder="REF-001" />
            </label>
            <label>Memo
              <input [(ngModel)]="form.memo" name="memo" placeholder="Narration" />
            </label>
          </div>

          <div class="lines">
            <div class="line-head">
              <span>Account</span><span>Debit</span><span>Credit</span><span></span>
            </div>
            <div class="line" *ngFor="let line of form.lines; let i = index">
              <select [(ngModel)]="line.accountCode" name="account-{{i}}" required>
                <option value="" disabled>Select account</option>
                <option *ngFor="let acc of accountOptions" [value]="acc.code">{{ acc.code }} — {{ acc.name }}</option>
              </select>
              <input type="number" step="0.01" min="0" [(ngModel)]="line.debit" name="debit-{{i}}" (input)="clearOpposite(i, 'debit')" />
              <input type="number" step="0.01" min="0" [(ngModel)]="line.credit" name="credit-{{i}}" (input)="clearOpposite(i, 'credit')" />
              <button class="chip danger" type="button" (click)="removeLine(i)">✕</button>
              <div class="inline-error" *ngIf="lineError(line)">Enter either debit or credit (not both)</div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-actions">
              <button class="chip" type="button" (click)="addLine()">+ Add Line</button>
              <button class="chip ghost" type="button" (click)="copyLast()">Copy last line</button>
              <button class="chip ghost" type="button" (click)="addBalancedPair()">Add balanced pair</button>
            </div>
            <div class="totals">
              <span>Debit: {{ totalDebit | number:'1.2-2' }}</span>
              <span>Credit: {{ totalCredit | number:'1.2-2' }}</span>
              <span class="status-pill" [class.danger]="!balanced" [class.good]="balanced">
                {{ balanced ? 'Balanced' : 'Out of balance' }}
              </span>
            </div>
            <button class="btn primary" type="submit" [disabled]="!canPost">Post Journal</button>
          </div>
          <p class="hint" *ngIf="!balanced">Entries must balance before posting.</p>
          <p class="hint" *ngIf="hasLineErrors()">Each line needs an account and only one side filled.</p>
        </form>
      </section>

      <section class="card">
        <div class="card-header">
          <h3 class="card-title">Recent Journals</h3>
          <span class="muted">Mock data for preview</span>
        </div>
        <div class="table">
          <div class="table-head">
            <span>No.</span><span>Date</span><span>Memo</span><span>Status</span><span>Debit</span><span>Credit</span>
          </div>
          <div class="table-row" *ngFor="let j of accounting.journals()">
            <span class="strong">{{ j.entryNumber }}</span>
            <span>{{ j.date | date:'mediumDate' }}</span>
            <span>{{ j.memo }}</span>
            <span><span class="pill" [class.draft]="j.status !== 'posted'">{{ j.status | titlecase }}</span></span>
            <span>{{ j.debit | number:'1.2-2' }}</span>
            <span>{{ j.credit | number:'1.2-2' }}</span>
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
    .form-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap:0.75rem; margin-bottom:1rem; }
    label { display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color: var(--color-text-primary); }
    input, select { border:1px solid var(--color-border); border-radius:8px; padding:0.6rem; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .lines { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; }
    .line-head, .line { display:grid; grid-template-columns: 2fr 1fr 1fr auto; gap:0.5rem; padding:0.65rem 0.75rem; align-items:center; }
    .line-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .line { border-top:1px solid var(--color-border); }
    .chip { border:1px solid var(--color-border); padding:0.35rem 0.7rem; border-radius:10px; background: var(--color-surface-hover); cursor:pointer; }
    .chip.danger { border-color: rgba(var(--color-error-rgb,239,68,68),0.3); color: var(--color-error,#ef4444); }
    .footer { display:flex; align-items:center; justify-content:space-between; gap:0.75rem; margin-top:0.75rem; flex-wrap:wrap; }
    .footer-actions { display:flex; gap:0.5rem; flex-wrap:wrap; }
    .totals { display:flex; gap:0.75rem; color: var(--color-text-primary); font-weight:600; }
    .danger { color: var(--color-error,#ef4444); }
    .status-pill { padding:0.25rem 0.6rem; border-radius:12px; background: rgba(var(--color-error-rgb,239,68,68),0.12); color: var(--color-error,#ef4444); font-weight:700; }
    .status-pill.good { background: rgba(var(--color-success-rgb,34,197,94),0.15); color: var(--color-success,#22c55e); }
    .hint { margin:0.25rem 0; color: var(--color-text-secondary); }
    .inline-error { grid-column: 1 / -1; color: var(--color-error,#ef4444); font-size:0.85rem; }
    .btn { border-radius:10px; padding:0.65rem 1.1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; color: var(--color-text-primary); }
    .table { border:1px solid var(--color-border); border-radius:10px; overflow:hidden; background: var(--color-surface); }
    .table-head, .table-row { display:grid; grid-template-columns: 1fr 1fr 2fr 1fr 1fr 1fr; padding:0.65rem 0.8rem; gap:0.5rem; align-items:center; }
    .table-head { background: var(--color-surface-hover); font-weight:700; color: var(--color-text-primary); }
    .table-row { border-top:1px solid var(--color-border); color: var(--color-text-secondary); }
    .strong { font-weight:700; color: var(--color-text-primary); }
    .pill { padding:0.2rem 0.45rem; border-radius:10px; background: var(--color-surface-hover); }
    .pill.draft { background: rgba(var(--color-warning-rgb,234,179,8),0.15); color: var(--color-warning,#eab308); }
    .muted { color: var(--color-text-secondary); }
    .breadcrumbs { display:flex; align-items:center; gap:0.35rem; color: var(--color-text-secondary); font-size:0.9rem; margin-bottom:0.25rem; }
    .breadcrumbs a { color: var(--color-primary); text-decoration:none; }
    .breadcrumbs .sep { color: var(--color-text-secondary); }
  `]
})
export class JournalsComponent {
  form: any = {
    date: new Date().toISOString().slice(0, 10),
    refNo: '',
    memo: '',
    lines: [
      { accountCode: '', debit: 0, credit: 0 },
      { accountCode: '', debit: 0, credit: 0 },
    ]
  };

  constructor(public accounting: AccountingService) {}

  get totalDebit() {
    return this.form.lines.reduce((sum: number, l: any) => sum + Number(l.debit || 0), 0);
  }

  get totalCredit() {
    return this.form.lines.reduce((sum: number, l: any) => sum + Number(l.credit || 0), 0);
  }

  get balanced() {
    return Math.abs(this.totalDebit - this.totalCredit) < 0.005 && this.totalDebit > 0;
  }

  addLine() {
    this.form.lines.push({ accountCode: '', debit: 0, credit: 0 });
  }

  removeLine(i: number) {
    this.form.lines.splice(i, 1);
  }

  clearOpposite(i: number, field: 'debit' | 'credit') {
    if (field === 'debit') this.form.lines[i].credit = 0;
    if (field === 'credit') this.form.lines[i].debit = 0;
  }

  post() {
    if (!this.canPost) return;
    const payload = {
      ...this.form,
      date: new Date(this.form.date),
      lines: this.form.lines.map((l: any) => ({
        accountCode: l.accountCode,
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
      }))
    };
    this.accounting.postJournal(payload).subscribe(() => {
      this.form = {
        date: new Date().toISOString().slice(0, 10),
        refNo: '',
        memo: '',
        lines: [
          { accountCode: '', debit: 0, credit: 0 },
          { accountCode: '', debit: 0, credit: 0 },
        ]
      };
      this.accounting.loadTrialBalance();
    });
  }

  get accountOptions() {
    const flat: { code: string; name: string }[] = [];
    const walk = (nodes: AccountNode[]) => {
      nodes.forEach(n => {
        flat.push({ code: n.code, name: n.name });
        if (n.children) walk(n.children);
      });
    };
    walk(this.accounting.accounts());
    return flat;
  }

  lineError(line: any) {
    const hasDebit = Number(line.debit || 0) > 0;
    const hasCredit = Number(line.credit || 0) > 0;
    return hasDebit && hasCredit;
  }

  hasLineErrors() {
    return this.form.lines.some((l: any) => this.lineError(l) || !l.accountCode);
  }

  get canPost() {
    return this.balanced && this.form.lines.length > 0 && !this.hasLineErrors();
  }

  copyLast() {
    const last = this.form.lines[this.form.lines.length - 1];
    if (!last) return;
    this.form.lines.push({ ...last });
  }

  addBalancedPair() {
    // adds two lines, one debit and one credit of the same amount (default 0)
    this.form.lines.push({ accountCode: '', debit: 0, credit: 0 });
    this.form.lines.push({ accountCode: '', debit: 0, credit: 0 });
  }
}
