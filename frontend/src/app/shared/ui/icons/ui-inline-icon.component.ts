import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'ui-inline-icon',
    standalone: true,
    imports: [CommonModule],
    template: `
    <span
      class="ui-inline-icon"
      [style.fontSize.px]="size"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.color]="color || null"
      aria-hidden="true"
    >
      <ng-container *ngIf="name; else projected">{{ name }}</ng-container>
      <ng-template #projected>
        <ng-content></ng-content>
      </ng-template>
    </span>
  `,
    styles: [`
    :host { display: inline-flex; }
    .ui-inline-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      vertical-align: middle;
      font-weight: 600;
      font-family: inherit;
    }
  `]
})
export class UiInlineIconComponent {
    @Input() name = '';
    @Input() size = 16;
    @Input() color?: string;
}
