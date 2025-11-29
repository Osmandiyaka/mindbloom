import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-online-review',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell">
      <h2>Application Review</h2>
      <p class="muted">Review workspace for application #{{ applicationId }}.</p>
    </section>
  `,
  styles: [
    `.page-shell{padding:1rem 1.5rem;}`,
    `h2{margin:0 0 0.35rem;}`,
    `.muted{margin:0;color:var(--color-text-secondary);}`
  ]
})
export class OnlineReviewComponent {
  applicationId = '';

  constructor(route: ActivatedRoute) {
    this.applicationId = route.snapshot.paramMap.get('id') ?? '';
  }
}
