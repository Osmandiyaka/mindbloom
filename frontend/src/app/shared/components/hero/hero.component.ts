import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
    selector: 'app-hero',
    standalone: true,
    imports: [CommonModule, ButtonComponent],
    template: `
    <div class="hero-card" [class.hero-compact]="compact">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">{{ title }}</h1>
          <p class="hero-subtitle">{{ subtitle }}</p>
          <div class="hero-actions" *ngIf="showActions">
            <ng-content select="[actions]" />
          </div>
        </div>
        <div class="hero-illustration" *ngIf="image">
          <img [src]="image" [alt]="title" />
        </div>
      </div>
    </div>
  `
})
export class HeroComponent {
    @Input({ required: true }) title!: string;
    @Input({ required: true }) subtitle!: string;
    @Input() image?: string;
    @Input() compact = false;
    @Input() showActions = false;
}
