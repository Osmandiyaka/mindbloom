import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-button',
    standalone: true,
    imports: [CommonModule],
    template: `
    <button
      [class]="getButtonClasses()"
      [disabled]="disabled"
      [type]="type">
      <ng-content />
    </button>
  `
})
export class ButtonComponent {
    @Input() variant: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' = 'primary';
    @Input() size: 'sm' | 'md' | 'lg' = 'md';
    @Input() disabled = false;
    @Input() block = false;
    @Input() type: 'button' | 'submit' | 'reset' = 'button';

    getButtonClasses(): string {
        const classes = ['btn', `btn-${this.variant}`];

        if (this.size !== 'md') {
            classes.push(`btn-${this.size}`);
        }

        if (this.block) {
            classes.push('btn-block');
        }

        return classes.join(' ');
    }
}
