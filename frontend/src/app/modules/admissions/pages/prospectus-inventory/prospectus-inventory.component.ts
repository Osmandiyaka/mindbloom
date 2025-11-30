import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface StockItem {
  name: string;
  code: string;
  stock: number;
  threshold: number;
}

@Component({
  selector: 'app-prospectus-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-shell">
      <header class="page-header">
        <div>
          <p class="eyebrow">Admissions · Prospectus</p>
          <h2>Prospectus Inventory</h2>
          <p class="muted">Track stock and restock before you run out.</p>
        </div>
      </header>

      <div class="panel">
        <div class="table" *ngIf="items().length; else empty">
          <div class="head"><div>Item</div><div>Code</div><div>Stock</div><div>Threshold</div><div>Actions</div></div>
          <div class="row" *ngFor="let item of items()">
            <div class="strong">{{ item.name }}</div>
            <div>{{ item.code }}</div>
            <div [class.low]="item.stock <= item.threshold">{{ item.stock }}</div>
            <div>{{ item.threshold }}</div>
            <div class="actions">
              <button class="btn tiny" (click)="adjust(item, 5)">+5</button>
              <button class="btn tiny ghost" (click)="adjust(item, -5)" [disabled]="item.stock <= 0">-5</button>
            </div>
          </div>
        </div>
        <ng-template #empty><p class="muted">No inventory data.</p></ng-template>
      </div>

      <div class="panel">
        <h3>Restock</h3>
        <div class="grid two">
          <label>Item<select [(ngModel)]="restock.code">
            <option *ngFor="let item of items()" [value]="item.code">{{ item.name }}</option>
          </select></label>
          <label>Amount<input type="number" [(ngModel)]="restock.amount" min="1" /></label>
        </div>
        <button class="btn primary" (click)="restockItem()">Add Stock</button>
      </div>
    </section>
  `,
  styles: [
    `.page-shell{padding:1rem 1.5rem; display:flex; flex-direction:column; gap:1rem;}`,
    `.page-header{display:flex; justify-content:space-between; align-items:flex-start;}`,
    `.eyebrow{text-transform:uppercase; letter-spacing:0.08em; margin:0; font-size:12px; color:var(--color-text-secondary);}`,
    `.muted{color:var(--color-text-secondary); margin:0;}`,
    `.panel{border:1px solid var(--color-border); border-radius:12px; padding:1rem; background:var(--color-surface); box-shadow:var(--shadow-sm);}`,
    `.table{border:1px solid var(--color-border); border-radius:12px; overflow:hidden;}
    .head, .row{display:grid; grid-template-columns:2fr 1fr 1fr 1fr 1fr; gap:0.5rem; padding:0.65rem 0.8rem; align-items:center;}
    .head{background:var(--color-surface-hover); font-weight:700;}
    .row{border-top:1px solid var(--color-border);} 
    .strong{font-weight:700;} 
    .actions{display:flex; gap:0.35rem;}
    .btn{border:1px solid var(--color-border); border-radius:8px; padding:0.35rem 0.7rem; cursor:pointer;}
    .btn.tiny{font-size:0.85rem;}
    .btn.primary{background:linear-gradient(135deg, var(--color-primary-light), var(--color-primary)); color:var(--color-background, #0f172a); border:none; box-shadow:var(--shadow-md, 0 8px 20px rgba(0,0,0,0.22));} 
    .btn.ghost{background:transparent;}
    .low{color:var(--color-error); font-weight:700;}
    .grid{display:grid; gap:0.75rem;}
    .grid.two{grid-template-columns:repeat(auto-fit,minmax(200px,1fr));}
    select, input{border:1px solid var(--color-border); border-radius:10px; padding:0.55rem 0.65rem; background:var(--color-surface-hover); color:var(--color-text-primary);} 
  `]
})
export class ProspectusInventoryComponent {
  items = signal<StockItem[]>([
    { name:'Prospectus 2025', code:'P25', stock:40, threshold:10 },
    { name:'Prospectus 2024', code:'P24', stock:12, threshold:8 },
  ]);

  restock = { code:'P25', amount:5 };

  adjust(item: StockItem, delta: number) {
    this.items.set(this.items().map(i => i.code === item.code ? { ...i, stock: Math.max(0, i.stock + delta) } : i));
  }

  restockItem() {
    const { code, amount } = this.restock;
    this.items.set(this.items().map(i => i.code === code ? { ...i, stock: i.stock + (amount || 0) } : i));
    this.restock = { ...this.restock, amount:5 };
  }
}
