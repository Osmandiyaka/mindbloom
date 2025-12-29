import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'ui-form-error',
    standalone: true,
    imports: [CommonModule],
    template: `
    <p class="ui-form-error" role="alert">
      <ng-content></ng-content>{{ text }}
    </p>
  `,
    styles: [`
    :host { display: block; }
    .ui-form-error {
      margin: 0.35rem 0 0;
      color: var(--color-error, #ef4444);
      font-size: 0.875rem;
      line-height: 1.4;
    }
  `]
})
export class UiFormErrorComponent {
    @Input() text = '';
}
