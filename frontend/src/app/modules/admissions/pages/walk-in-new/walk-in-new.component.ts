import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-walk-in-new',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell">
      <h2>New Walk-in Admission</h2>
      <p class="muted">Stepped walk-in flow will live here.</p>
    </section>
  `,
  styles: [`
    .page-shell { padding: 1rem 1.5rem; }
    h2 { margin: 0 0 0.35rem; }
    .muted { color: var(--color-text-secondary); margin: 0; }
  `]
})
export class WalkInNewComponent { }
