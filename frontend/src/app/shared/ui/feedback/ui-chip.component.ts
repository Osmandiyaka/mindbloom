import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'ui-chip',
    standalone: true,
    imports: [CommonModule],
    template: `
    <span class="ui-chip" [class.ui-chip--selected]="selected">
      <span class="ui-chip__content">
        <ng-content></ng-content>{{ label }}
      </span>
      <button
        *ngIf="removable"
        type="button"
        class="ui-chip__remove"
        (click)="onRemove($event)"
        aria-label="Remove chip"
      >
        ×
      </button>
    </span>
  `,
    styles: [`
    :host { display: inline-flex; }
    .ui-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      border: 1px solid var(--border-default, var(--color-border));
      background: var(--color-surface, #fff);
      color: var(--color-text-primary);
      line-height: 1.2;
      font-weight: 600;
      transition: all 0.12s ease;
    }

    .ui-chip--selected {
      background: color-mix(in srgb, var(--color-primary) 12%, #ffffff 88%);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .ui-chip__remove {
      border: none;
      background: transparent;
      cursor: pointer;
      color: inherit;
      font-size: 0.95rem;
      padding: 0;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .ui-chip__remove:focus {
      outline: none;
      box-shadow: 0 0 0 3px var(--focus-ring-color, rgba(102,126,234,0.12));
      border-radius: 50%;
    }
  `]
})
export class UiChipComponent {
    @Input() label = '';
    @Input() selected = false;
    @Input() removable = false;
    @Output() removed = new EventEmitter<void>();

    onRemove(event: Event) {
        event.stopPropagation();
        this.removed.emit();
    }
}
