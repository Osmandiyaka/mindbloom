import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

type MbButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
type MbButtonSize = 'sm' | 'md' | 'lg';

@Component({
    selector: 'mb-button',
    standalone: true,
    imports: [CommonModule],
    host: {
        '[class.mb-button-host--full]': 'fullWidth'
    },
    template: `
        <button
            class="mb-button"
            [class.mb-button--primary]="variant === 'primary'"
            [class.mb-button--secondary]="variant === 'secondary'"
            [class.mb-button--tertiary]="variant === 'tertiary'"
            [class.mb-button--danger]="variant === 'danger'"
            [class.mb-button--sm]="size === 'sm'"
            [class.mb-button--lg]="size === 'lg'"
            [class.mb-button--full]="fullWidth"
            [class.mb-button--loading]="loading"
            [disabled]="disabled || loading"
            [attr.type]="type"
            [attr.aria-label]="ariaLabel || null"
            [attr.aria-busy]="loading"
            [attr.aria-disabled]="disabled || loading"
            (click)="handleClick($event)"
        >
            <span class="mb-button__content">
                <span class="mb-button__spinner" *ngIf="loading" aria-hidden="true"></span>
                <span class="mb-button__label" [class.mb-button__label--hidden]="loading && hideLabelOnLoading">
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
    @Input() fullWidth = false;
    @Input() hideLabelOnLoading = true;
    @Input() disabled = false;
    @Input() loading = false;
    @Input() ariaLabel?: string;
    @Output() click = new EventEmitter<MouseEvent>();

    handleClick(event: MouseEvent): void {
        if (this.disabled || this.loading) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        this.click.emit(event);
    }
}
