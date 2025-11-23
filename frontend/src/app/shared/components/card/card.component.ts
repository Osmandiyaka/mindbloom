import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div [class]="getCardClasses()">
      <ng-content />
    </div>
  `
})
export class CardComponent {
    @Input() hover = false;
    @Input() clickable = false;
    @Input() flat = false;
    @Input() elevated = false;
    @Input() borderless = false;
    @Input() compact = false;
    @Input() large = false;

    getCardClasses(): string {
        const classes = ['card'];

        if (this.hover) classes.push('card-hover');
        if (this.clickable) classes.push('card-clickable');
        if (this.flat) classes.push('card-flat');
        if (this.elevated) classes.push('card-elevated');
        if (this.borderless) classes.push('card-borderless');
        if (this.compact) classes.push('card-compact');
        if (this.large) classes.push('card-lg');

        return classes.join(' ');
    }
}
