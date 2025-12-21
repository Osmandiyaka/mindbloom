import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grade-card-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid">
      <div class="card" *ngFor="let g of grades">
        <div class="label">{{ g.subject }}</div>
        <div class="value">{{ g.score }}</div>
        <div class="meta">{{ g.term }}</div>
      </div>
    </div>
  `,
  styles: [`
    .grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
    .card { background: var(--surface, #fff); border: 1px solid var(--border, #e2e8f0); border-radius: var(--radius-card, 14px); padding: 12px; box-shadow: var(--card-shadow, 0 10px 30px rgba(0,0,0,0.06)); }
    .label { color: var(--text-muted, #475569); text-transform: uppercase; letter-spacing: .05em; font-size: 12px; }
    .value { color: var(--text, #0f172a); font-weight: 800; font-size: 26px; }
    .meta { color: var(--text-muted, #475569); font-size: 12px; }
  `]
})
export class GradeCardGridComponent {
  @Input() grades: Array<{ subject: string; score: string; term: string }> = [];
}
