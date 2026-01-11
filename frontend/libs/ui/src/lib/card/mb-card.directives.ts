import { Directive } from '@angular/core';

@Directive({
    selector: '[mbCardHeader]',
    standalone: true
})
export class MbCardHeaderDirective {}

@Directive({
    selector: '[mbCardFooter]',
    standalone: true
})
export class MbCardFooterDirective {}

@Directive({
    selector: '[mbCardActions]',
    standalone: true
})
export class MbCardActionsDirective {}
