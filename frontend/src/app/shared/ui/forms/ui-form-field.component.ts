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
      position: relative;
      display: block;
      width: 100%;
      --ui-input-padding-left: 0.65rem;
      --ui-input-padding-right: 0.65rem;
    }

    .ui-form-field__control:has([uiPrefix]) {
      --ui-input-padding-left: 2.25rem;
    }

    .ui-form-field__control:has([uiSuffix]) {
      --ui-input-padding-right: 3rem;
    }

    .ui-form-field__control > [uiPrefix],
    .ui-form-field__control > [uiSuffix] {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      display: inline-flex;
      align-items: center;
      color: var(--color-text-secondary, #6b7280);
    }

    .ui-form-field__control > [uiPrefix] {
      left: 0.75rem;
      pointer-events: none;
    }

    .ui-form-field__control > [uiSuffix] {
      right: 0.5rem;
    }

    .ui-form-field__control > *:not([uiPrefix]):not([uiSuffix]) {
      display: block;
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
