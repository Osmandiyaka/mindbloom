import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-reports-conversion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell">
      <h2>Conversion Analytics</h2>
      <p class="muted">Conversion funnels and segment insights will be displayed here.</p>
    </section>
  `,
  styles: [
    `.page-shell{padding:1rem 1.5rem;}`,
    `h2{margin:0 0 0.35rem;}`,
    `.muted{margin:0;color:var(--color-text-secondary);}`
  ]
})
export class ReportsConversionComponent {}
