import { Directive } from '@angular/core';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';

@Directive({
    selector: '[mbPopoverTrigger]',
    standalone: true,
    hostDirectives: [CdkOverlayOrigin]
})
export class MbPopoverTriggerDirective {}
