import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'ui-toolbar',
    standalone: true,
    imports: [CommonModule],
    template: `<div class="ui-toolbar"><ng-content/></div>`,
    styles: [`.ui-toolbar{display:flex;gap:8px;align-items:center}`]
})
export class UiToolbarComponent { }
