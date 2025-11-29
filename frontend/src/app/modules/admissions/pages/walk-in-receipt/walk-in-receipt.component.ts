import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-walk-in-receipt',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell">
      <h2>Walk-in Receipt</h2>
      <p class="muted">Receipt preview for ID: {{ id }}</p>
    </section>
  `,
  styles: [`
    .page-shell { padding: 1rem 1.5rem; }
    h2 { margin: 0 0 0.35rem; }
    .muted { color: var(--color-text-secondary); margin: 0; }
  `]
})
export class WalkInReceiptComponent {
  id = this.route.snapshot.paramMap.get('id');
  constructor(private route: ActivatedRoute) { }
}
