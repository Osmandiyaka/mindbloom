import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
    selector: 'app-modal',
    standalone: true,
    imports: [CommonModule, ButtonComponent],
    template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="onOverlayClick($event)">
      <div class="modal" [class]="'modal-' + size">
        <div class="modal-header" *ngIf="title">
          <h3 class="modal-title">{{ title }}</h3>
          <button class="modal-close" (click)="close()" *ngIf="showClose">
            <span>✕</span>
          </button>
        </div>
        <div class="modal-body" [class.modal-body-compact]="compact">
          <ng-content />
        </div>
        <div class="modal-footer" *ngIf="showFooter">
          <ng-content select="[footer]" />
        </div>
      </div>
    </div>
  `
})
export class ModalComponent {
    @Input() isOpen = false;
    @Input() title?: string;
    @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
    @Input() showClose = true;
    @Input() showFooter = true;
    @Input() compact = false;
    @Input() closeOnOverlay = true;

    @Output() closed = new EventEmitter<void>();

    close(): void {
        this.isOpen = false;
        this.closed.emit();
    }

    onOverlayClick(event: MouseEvent): void {
        if (this.closeOnOverlay && event.target === event.currentTarget) {
            this.close();
        }
    }
}
