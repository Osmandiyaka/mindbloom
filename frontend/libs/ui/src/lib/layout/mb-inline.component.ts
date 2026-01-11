import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type MbAlign = 'start' | 'center' | 'end' | 'stretch';
type MbJustify = 'start' | 'center' | 'end' | 'space-between';

@Component({
    selector: 'mb-inline',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div
            class="mb-inline"
            [style.gap]="gap"
            [style.align-items]="align"
            [style.justify-content]="justify"
            [style.flex-wrap]="wrap ? 'wrap' : 'nowrap'"
        >
            <ng-content></ng-content>
        </div>
    `,
    styleUrls: ['./mb-inline.component.scss']
})
export class MbInlineComponent {
    @Input() gap = 'var(--mb-space-3)';
    @Input() align: MbAlign = 'center';
    @Input() justify: MbJustify = 'start';
    @Input() wrap = false;
}
