import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'ui-spinner',
    standalone: true,
    imports: [CommonModule],
    template: `
    <span
      class="ui-spinner"
      [style.width.px]="size"
      [style.height.px]="size"
      role="status"
      [attr.aria-label]="label || 'Loading'"
    ></span>
  `,
    styles: [`
    :host { display: inline-flex; }
    .ui-spinner {
      border-radius: 50%;
      border: 2px solid var(--spinner-track, rgba(0,0,0,0.1));
      border-top-color: var(--spinner-head, var(--color-primary));
      animation: ui-spin 0.75s linear infinite;
      display: inline-block;
    }

    @keyframes ui-spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class UiSpinnerComponent {
    @Input() size = 18;
    @Input() label = '';
}
