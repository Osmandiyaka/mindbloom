import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'ui-form-hint',
    standalone: true,
    imports: [CommonModule],
    template: `
    <p class="ui-form-hint">
      <ng-content></ng-content>{{ text }}
    </p>
  `,
    styles: [`
    :host { display: block; }
    .ui-form-hint {
      margin: 0.35rem 0 0;
      color: var(--color-text-secondary, #6b7280);
      font-size: 0.875rem;
      line-height: 1.4;
    }
  `]
})
export class UiFormHintComponent {
    @Input() text = '';
}
