import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-overlay" *ngIf="isOpen" (click)="onOverlayClick($event)">
      <div class="dialog-content">
        <div class="dialog-header">
          <div class="dialog-icon" [class]="'icon-' + type">
            <span>{{ getIcon() }}</span>
          </div>
          <h3 class="dialog-title">{{ title }}</h3>
        </div>
        
        <div class="dialog-body">
          <p>{{ message }}</p>
        </div>
        
        <div class="dialog-footer">
          <button 
            (click)="onCancel()" 
            class="btn-cancel"
            [disabled]="processing"
          >
            {{ cancelText }}
          </button>
          <button 
            (click)="onConfirm()" 
            class="btn-confirm"
            [class]="'btn-' + type"
            [disabled]="processing"
          >
            {{ processing ? processingText : confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .dialog-content {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      max-width: 450px;
      width: 90%;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .dialog-header {
      padding: 2rem 2rem 1rem;
      text-align: center;
    }

    .dialog-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 1rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
    }

    .icon-warning {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    }

    .icon-danger {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    }

    .icon-info {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    }

    .icon-success {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    }

    .dialog-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
    }

    .dialog-body {
      padding: 0 2rem 1.5rem;
      text-align: center;
    }

    .dialog-body p {
      margin: 0;
      color: var(--color-text-secondary, #374151);
      font-size: 1rem;
      line-height: 1.6;
    }

    .dialog-footer {
      padding: 1.5rem 2rem 2rem;
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .btn-cancel,
    .btn-confirm {
      flex: 1;
      padding: 0.875rem 1.5rem;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-cancel {
      background: #f3f4f6;
      color: var(--color-text-primary, #111827);
    }

    .btn-cancel:hover:not(:disabled) {
      background: #e5e7eb;
    }

    .btn-confirm {
      color: white;
    }

    .btn-warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    .btn-warning:hover:not(:disabled) {
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    }

    .btn-danger {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }

    .btn-danger:hover:not(:disabled) {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    }

    .btn-info {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }

    .btn-info:hover:not(:disabled) {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    }

    .btn-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .btn-success:hover:not(:disabled) {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
    }

    .btn-cancel:disabled,
    .btn-confirm:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class ConfirmationDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() type: 'warning' | 'danger' | 'info' | 'success' = 'warning';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() processingText = 'Processing...';
  @Input() processing = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  getIcon(): string {
    const icons = {
      warning: '⚠️',
      danger: '🗑️',
      info: 'ℹ️',
      success: '✓'
    };
    return icons[this.type];
  }

  onConfirm(): void {
    if (!this.processing) {
      this.confirmed.emit();
    }
  }

  onCancel(): void {
    if (!this.processing) {
      this.cancelled.emit();
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if (!this.processing && event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}
