import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type MbButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
type MbButtonSize = 'sm' | 'md' | 'lg';

@Component({
    selector: 'mb-button',
    standalone: true,
    imports: [CommonModule],
    template: `
        <button
            class="mb-button"
            [class.mb-button--primary]="variant === 'primary'"
            [class.mb-button--secondary]="variant === 'secondary'"
            [class.mb-button--tertiary]="variant === 'tertiary'"
            [class.mb-button--danger]="variant === 'danger'"
            [class.mb-button--sm]="size === 'sm'"
            [class.mb-button--lg]="size === 'lg'"
            [class.mb-button--loading]="loading"
            [disabled]="disabled || loading"
            [attr.type]="type"
            [attr.aria-label]="ariaLabel || null"
            [attr.aria-busy]="loading"
            [attr.aria-disabled]="disabled || loading"
        >
            <span class="mb-button__content">
                <span class="mb-button__spinner" *ngIf="loading" aria-hidden="true"></span>
                <span class="mb-button__label" [class.mb-button__label--hidden]="loading">
                    <ng-content></ng-content>
                </span>
            </span>
        </button>
    `,
    styleUrls: ['./mb-button.component.scss']
})
export class MbButtonComponent {
    @Input() variant: MbButtonVariant = 'primary';
    @Input() size: MbButtonSize = 'md';
    @Input() type: 'button' | 'submit' | 'reset' = 'button';
    @Input() disabled = false;
    @Input() loading = false;
    @Input() ariaLabel?: string;
}
