import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-check-eligibility',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell">
      <h2>Eligibility Checker</h2>
      <p class="muted">Form and guidance for quick eligibility checks will render here.</p>
    </section>
  `,
  styles: [
    `.page-shell{padding:1rem 1.5rem;}`,
    `h2{margin:0 0 0.35rem;}`,
    `.muted{margin:0;color:var(--color-text-secondary);}`
  ]
})
export class CheckEligibilityComponent {}
