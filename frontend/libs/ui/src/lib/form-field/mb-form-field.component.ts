import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'mb-form-field',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="mb-form-field" [class.mb-form-field--error]="!!error">
            <label *ngIf="label" class="mb-form-field__label" [attr.for]="controlId">
                <span>{{ label }}</span>
                <span *ngIf="required" class="mb-form-field__required" aria-hidden="true">*</span>
            </label>
            <div class="mb-form-field__control">
                <ng-content select="[mbPrefix]"></ng-content>
                <ng-content></ng-content>
                <ng-content select="[mbSuffix]"></ng-content>
            </div>
            <div *ngIf="!error && hint" class="mb-form-field__hint">{{ hint }}</div>
            <div *ngIf="error" class="mb-form-field__error" role="alert">{{ error }}</div>
        </div>
    `,
    styleUrls: ['./mb-form-field.component.scss']
})
export class MbFormFieldComponent {
    @Input() label?: string;
    @Input() hint?: string;
    @Input() error?: string;
    @Input() required = false;
    @Input() controlId?: string;
}
