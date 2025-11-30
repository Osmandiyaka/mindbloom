import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-prospectus-sell',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-shell">
      <header class="page-header">
        <div>
          <p class="eyebrow">Admissions · Prospectus</p>
          <h2>Sell Prospectus</h2>
          <p class="muted">Collect payment and issue a prospectus instantly.</p>
        </div>
      </header>

      <div class="layout">
        <div class="panel">
          <h3>New Sale</h3>
          <div class="grid two">
            <label>Buyer Name<input [(ngModel)]="form.buyer" placeholder="Parent/Guardian name" /></label>
            <label>Email<input [(ngModel)]="form.email" placeholder="email@school.com" /></label>
            <label>Quantity<input type="number" min="1" [(ngModel)]="form.qty" /></label>
            <label>Price per copy<input type="number" min="0" [(ngModel)]="form.price" /></label>
            <label class="full">Notes<textarea [(ngModel)]="form.note" rows="2" placeholder="Receipt notes"></textarea></label>
          </div>
          <div class="summary">
            <span>Total: <strong>₦{{ total() }}</strong></span>
            <button class="btn primary" (click)="record()">Record Sale</button>
          </div>
        </div>

        <div class="panel">
          <h3>Recent Sales</h3>
          <div class="summary-cards">
            <div class="card"><p class="muted small">Today</p><h4>₦{{ todayTotal() }}</h4></div>
            <div class="card"><p class="muted small">Copies Sold</p><h4>{{ soldCount() }}</h4></div>
          </div>
          <div class="table" *ngIf="sales().length; else empty">
            <div class="head">
              <div>Buyer</div><div>Qty</div><div>Total</div><div>Date</div>
            </div>
            <div class="row" *ngFor="let s of sales()">
              <div>
                <div class="strong">{{ s.buyer }}</div>
                <div class="muted small">{{ s.email }}</div>
              </div>
              <div>{{ s.qty }}</div>
              <div>₦{{ s.total }}</div>
              <div>{{ s.date | date:'short' }}</div>
            </div>
          </div>
          <ng-template #empty><p class="muted">No sales yet.</p></ng-template>
        </div>
      </div>
    </section>
  `,
  styles: [
    `.page-shell{padding:1rem 1.5rem; display:flex; flex-direction:column; gap:1rem;}`,
    `.page-header{display:flex; justify-content:space-between; align-items:flex-start;}`,
    `.eyebrow{text-transform:uppercase; letter-spacing:0.08em; margin:0; font-size:12px; color:var(--color-text-secondary);}`,
    `.muted{color:var(--color-text-secondary); margin:0;}`,
    `.layout{display:grid; grid-template-columns:1.2fr 1fr; gap:1rem; align-items:start;}`,
    `.panel{border:1px solid var(--color-border); border-radius:12px; padding:1rem; background:var(--color-surface); box-shadow:var(--shadow-sm); display:flex; flex-direction:column; gap:0.75rem;}`,
    `.grid{display:grid; gap:0.75rem;}`,
    `.grid.two{grid-template-columns:repeat(auto-fit,minmax(200px,1fr));}`,
    `label{display:flex; flex-direction:column; gap:0.3rem; font-weight:600; color:var(--color-text-primary);}`,
    `input, textarea{border:1px solid var(--color-border); border-radius:10px; padding:0.55rem 0.65rem; background:var(--color-surface-hover); color:var(--color-text-primary);}`,
    `.full{grid-column:1 / -1;}`,
    `.summary{display:flex; justify-content:space-between; align-items:center; gap:1rem;}`,
    `.btn{border:1px solid var(--color-border); border-radius:10px; padding:0.6rem 1rem; font-weight:700; cursor:pointer; background:var(--color-surface); color:var(--color-text-primary);}`,
    `.primary{background:linear-gradient(135deg, var(--color-primary-light), var(--color-primary)); color:var(--color-background, #0f172a); border:none; box-shadow:var(--shadow-md, 0 10px 24px rgba(0,0,0,0.22));}`,
    `.summary-cards{display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:0.5rem;}`,
    `.card{border:1px solid var(--color-border); border-radius:10px; padding:0.65rem 0.8rem; background:var(--color-surface-hover);}`,
    `.table{border:1px solid var(--color-border); border-radius:12px; overflow:hidden;}`,
    `.head, .row{display:grid; grid-template-columns:2fr 0.6fr 0.8fr 1fr; gap:0.5rem; padding:0.65rem 0.8rem; align-items:center;}`,
    `.head{background:var(--color-surface-hover); font-weight:700;}`,
    `.row{border-top:1px solid var(--color-border);}`,
    `.strong{font-weight:700;}
  `]
})
export class ProspectusSellComponent {
  sales = signal<{ buyer:string; email:string; qty:number; total:number; date:Date }[]>([
    { buyer:'Ngozi Ade', email:'ngozi@example.com', qty:1, total:5000, date:new Date() },
    { buyer:'Tunde Bello', email:'tunde@example.com', qty:2, total:10000, date:new Date() },
  ]);

  form = { buyer:'', email:'', qty:1, price:5000, note:'' };

  total() { return (this.form.qty || 0) * (this.form.price || 0); }
  soldCount() { return this.sales().reduce((s,x)=>s+x.qty,0); }
  todayTotal() { return this.sales().reduce((s,x)=>s+x.total,0); }

  record() {
    if (!this.form.buyer || !this.form.qty || !this.form.price) return;
    const entry = { buyer:this.form.buyer, email:this.form.email, qty:this.form.qty, total:this.total(), date:new Date() };
    this.sales.set([entry, ...this.sales()]);
    this.form = { buyer:'', email:'', qty:1, price:5000, note:'' };
  }
}
