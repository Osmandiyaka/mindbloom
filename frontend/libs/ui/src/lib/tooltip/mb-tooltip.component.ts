import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'mb-tooltip-overlay',
    standalone: true,
    imports: [CommonModule],
    template: `<div class="mb-tooltip" role="tooltip" [attr.id]="id">{{ text }}</div>`,
    styleUrls: ['./mb-tooltip.component.scss']
})
export class MbTooltipOverlayComponent {
    @Input() text = '';
    @Input() id = '';
}
