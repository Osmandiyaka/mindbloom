import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'ui-label',
    standalone: true,
    imports: [CommonModule],
    template: `
    <label class="ui-label" [attr.for]="for">
      <ng-content></ng-content>{{ text }}
      <span *ngIf="required" class="ui-label__required" aria-hidden="true">*</span>
    </label>
  `,
    styles: [`
    :host { display: inline-block; }
    .ui-label {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .ui-label__required { color: var(--color-error, #ef4444); }
  `]
})
export class UiLabelComponent {
    @Input() for?: string;
    @Input() text = '';
    @Input() required = false;
}
