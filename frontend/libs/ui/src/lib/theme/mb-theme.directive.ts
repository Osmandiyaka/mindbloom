import { Directive, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { MbDensityMode, MbTenantBranding, MbThemeMode } from './mb-theme.types';
import { MbThemeService } from './mb-theme.service';

@Directive({
    selector: '[mbTheme]',
    standalone: true
})
export class MbThemeDirective implements OnChanges {
    private readonly theme = inject(MbThemeService);

    @Input() mbThemeMode?: MbThemeMode;
    @Input() mbDensity?: MbDensityMode;
    @Input() mbTenant?: MbTenantBranding;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['mbThemeMode'] && this.mbThemeMode) {
            this.theme.setMode(this.mbThemeMode);
        }
        if (changes['mbDensity'] && this.mbDensity) {
            this.theme.setDensity(this.mbDensity);
        }
        if (changes['mbTenant']) {
            this.theme.setTenantBranding(this.mbTenant);
        }
    }
}
