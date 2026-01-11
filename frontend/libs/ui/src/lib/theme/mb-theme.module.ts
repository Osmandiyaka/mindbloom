import { NgModule } from '@angular/core';
import { MbThemeDirective } from './mb-theme.directive';

@NgModule({
    imports: [MbThemeDirective],
    exports: [MbThemeDirective]
})
export class MbThemeModule {}
