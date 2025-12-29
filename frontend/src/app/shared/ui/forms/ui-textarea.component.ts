import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'ui-textarea',
    standalone: true,
    imports: [CommonModule],
    template: `
    <textarea
      class="ui-textarea"
      [attr.rows]="rows"
      [placeholder]="placeholder"
      [disabled]="disabledState"
      [value]="value"
      (input)="onInput($event)"
    ></textarea>
  `,
    styles: [`
    :host { display: block; }
    .ui-textarea {
      width: 100%;
      min-height: 120px;
      border-radius: 10px;
      padding: 0.6rem 0.7rem;
      border: 1px solid var(--border-default, var(--color-border));
      background: var(--content-background-solid, var(--color-background));
      color: var(--color-text-primary);
      transition: box-shadow 0.12s ease, border-color 0.12s ease;
      font: inherit;
      resize: vertical;
    }

    .ui-textarea:focus {
      outline: none;
      box-shadow: 0 0 0 3px var(--focus-ring-color, rgba(102,126,234,0.12));
      border-color: var(--color-primary);
    }

    .ui-textarea:disabled { opacity: 0.7; }
  `]
})
export class UiTextareaComponent {
    @Input() value = '';
    @Output() valueChange = new EventEmitter<string>();

    @Input() placeholder = '';
    @Input() rows = 4;
    @Input() disabled: boolean | '' | string = false;

    get disabledState(): boolean {
        if (this.disabled === '') return true;
        if (this.disabled === true) return true;
        if (this.disabled === 'true') return true;
        if (typeof this.disabled === 'string') return this.disabled.length > 0 && this.disabled !== 'false';
        return false;
    }

    onInput(event: Event) {
        const v = (event.target as HTMLTextAreaElement).value;
        this.value = v;
        this.valueChange.emit(v);
    }
}
