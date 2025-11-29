import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-reports-collection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell">
      <h2>Collection Report</h2>
      <p class="muted">Payment collection analytics for admissions will be built here.</p>
    </section>
  `,
  styles: [
    `.page-shell{padding:1rem 1.5rem;}`,
    `h2{margin:0 0 0.35rem;}`,
    `.muted{margin:0;color:var(--color-text-secondary);}`
  ]
})
export class ReportsCollectionComponent {}
