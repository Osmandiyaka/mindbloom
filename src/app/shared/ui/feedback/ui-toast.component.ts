import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'ui-toast',
    standalone: true,
    imports: [CommonModule],
    template: `<div class="ui-toast"><ng-content/></div>`,
    styles: [`.ui-toast{padding:12px;border-radius:8px;background:var(--color-surface);color:var(--color-text-primary);}`]
})
export class UiToastComponent { }
