import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'ui-divider',
    standalone: true,
    imports: [CommonModule],
    template: `
    <hr class="ui-divider" [class.ui-divider--inset]="inset" />
  `,
    styles: [`
    :host { display: block; }
    .ui-divider {
      border: none;
      border-top: 1px solid var(--border-default, var(--color-border));
      margin: 0.75rem 0;
    }

    .ui-divider--inset {
      margin-left: 1.25rem;
      margin-right: 0;
    }
  `]
})
export class UiDividerComponent {
    @Input() inset = false;
}
