import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-prospectus-inventory',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell">
      <h2>Prospectus Inventory</h2>
      <p class="muted">Stock levels and audit trails for prospectus inventory will sit here.</p>
    </section>
  `,
  styles: [
    `.page-shell{padding:1rem 1.5rem;}`,
    `h2{margin:0 0 0.35rem;}`,
    `.muted{margin:0;color:var(--color-text-secondary);}`
  ]
})
export class ProspectusInventoryComponent {}
