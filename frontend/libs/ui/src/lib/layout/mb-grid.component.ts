import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'mb-grid',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="mb-grid" [style.gap]="gap" [style.grid-template-columns]="columns">
            <ng-content></ng-content>
        </div>
    `,
    styleUrls: ['./mb-grid.component.scss']
})
export class MbGridComponent {
    @Input() gap = 'var(--mb-space-4)';
    @Input() columns = 'repeat(auto-fit, minmax(240px, 1fr))';
}
