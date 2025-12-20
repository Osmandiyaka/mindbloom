import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'ui-dialog-placeholder',
    standalone: true,
    imports: [CommonModule],
    template: `<div class="ui-dialog"><ng-content/></div>`,
    styles: [`.ui-dialog{padding:16px;background:var(--color-surface);border-radius:10px}`]
})
export class UiDialogPlaceholderComponent { }
