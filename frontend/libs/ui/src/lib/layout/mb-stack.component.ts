import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'mb-stack',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="mb-stack" [style.gap]="gap">
            <ng-content></ng-content>
        </div>
    `,
    styleUrls: ['./mb-stack.component.scss']
})
export class MbStackComponent {
    @Input() gap = 'var(--mb-space-4)';
}
