import { Directive, TemplateRef } from '@angular/core';

@Directive({
    selector: '[mbTableActions]',
    standalone: true
})
export class MbTableActionsDirective {
    constructor(public template: TemplateRef<any>) {}
}
