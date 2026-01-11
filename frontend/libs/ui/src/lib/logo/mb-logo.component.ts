import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type MbLogoVariant = 'icon' | 'horizontal' | 'stacked';
type MbLogoSize = 'sm' | 'md' | 'lg';

@Component({
    selector: 'mb-logo',
    standalone: true,
    imports: [CommonModule],
    template: `
        <span
            class="mb-logo"
            [class.mb-logo--sm]="size === 'sm'"
            [class.mb-logo--md]="size === 'md'"
            [class.mb-logo--lg]="size === 'lg'"
            [class.mb-logo--icon]="variant === 'icon'"
            [class.mb-logo--stacked]="variant === 'stacked'"
            [class.mb-logo--horizontal]="variant === 'horizontal'"
            [attr.role]="decorative ? null : 'img'"
            [attr.aria-label]="decorative ? null : 'MindBloom'"
            [attr.aria-hidden]="decorative ? 'true' : null"
        >
            <span
                class="mb-logo__asset"
                aria-hidden="true"
                [style.maskImage]="logoUrl"
                [style.webkitMaskImage]="logoUrl"
            ></span>
        </span>
    `,
    styleUrls: ['./mb-logo.component.scss']
})
export class MbLogoComponent {
    @Input() variant: MbLogoVariant = 'horizontal';
    @Input() size: MbLogoSize = 'md';
    @Input() decorative = false;

    get logoUrl(): string {
        switch (this.variant) {
            case 'icon':
                return "url('/assets/brand/mindbloom-icon.svg')";
            case 'stacked':
                return "url('/assets/brand/mindbloom-lockup-stacked.svg')";
            default:
                return "url('/assets/brand/mindbloom-lockup-horizontal.svg')";
        }
    }
}
