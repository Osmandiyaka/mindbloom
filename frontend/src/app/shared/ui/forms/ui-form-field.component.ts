import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { UiFormErrorComponent } from './ui-form-error.component';
import { UiFormHintComponent } from './ui-form-hint.component';
import { UiLabelComponent } from './ui-label.component';

@Component({
    selector: 'ui-form-field',
    standalone: true,
    imports: [CommonModule, UiLabelComponent, UiFormHintComponent, UiFormErrorComponent],
    template: `
    <div class="ui-form-field" [class.ui-form-field--error]="hasError">
      <ui-label *ngIf="label" [for]="for" [required]="required">{{ label }}</ui-label>

      <div class="ui-form-field__control">
        <ng-content select="[uiPrefix]"></ng-content>
        <ng-content></ng-content>
        <ng-content select="[uiSuffix]"></ng-content>
      </div>

      <ui-form-hint *ngIf="!hasError && hint" [text]="hint"></ui-form-hint>
      <ui-form-error *ngIf="hasError" [text]="error"></ui-form-error>
    </div>
  `,
    styles: [`
    :host { display: block; }
    .ui-form-field { display: flex; flex-direction: column; gap: 0.35rem; }
    .ui-form-field__control {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
    }

    .ui-form-field__control > [uiPrefix],
    .ui-form-field__control > [uiSuffix] {
      display: inline-flex;
      align-items: center;
      color: var(--color-text-secondary, #6b7280);
    }

    .ui-form-field__control > *:not([uiPrefix]):not([uiSuffix]) {
      flex: 1 1 auto;
      width: 100%;
    }

    .ui-form-field--error .ui-form-field__control :where(input, textarea, select) {
      border-color: var(--color-error, #ef4444);
    }
  `]
})
export class UiFormFieldComponent {
    @Input() label = '';
    @Input() for?: string;
    @Input() required = false;
    @Input() hint = '';
    @Input() error = '';

    get hasError(): boolean {
        return !!this.error;
    }
}
