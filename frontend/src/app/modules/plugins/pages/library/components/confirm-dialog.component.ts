import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService } from '../services/dialog.service';

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [CommonModule],
    template: `
        @if (dialogService.activeDialog()) {
            <div class="dialog-overlay" (click)="dialogService.handleCancel()">
                <div class="dialog-content" (click)="$event.stopPropagation()" [class]="dialogService.activeDialog()?.type">
                    <div class="dialog-header">
                        <h3>{{ dialogService.activeDialog()?.title }}</h3>
                        <button class="close-btn" (click)="dialogService.handleCancel()">✕</button>
                    </div>
                    <div class="dialog-body">
                        <p>{{ dialogService.activeDialog()?.message }}</p>
                    </div>
                    <div class="dialog-footer">
                        <button class="btn-cancel" (click)="dialogService.handleCancel()">
                            {{ dialogService.activeDialog()?.cancelText }}
                        </button>
                        <button class="btn-confirm" [class]="dialogService.activeDialog()?.type" (click)="dialogService.handleConfirm()">
                            {{ dialogService.activeDialog()?.confirmText }}
                        </button>
                    </div>
                </div>
            </div>
        }
    `,
    styles: [`
        .dialog-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .dialog-content {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 90%;
            animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
            from {
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .dialog-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
        }

        .dialog-content.danger .dialog-header {
            border-bottom-color: #fee2e2;
        }

        h3 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 700;
        }

        .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #9ca3af;
            cursor: pointer;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.2s;
        }

        .close-btn:hover {
            background: #f3f4f6;
            color: #1a1a1a;
        }

        .dialog-body {
            padding: 1.5rem;
        }

        .dialog-body p {
            margin: 0;
            color: #4b5563;
            line-height: 1.6;
        }

        .dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            padding: 1.5rem;
            border-top: 1px solid #e5e7eb;
        }

        .btn-cancel, .btn-confirm {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-cancel {
            background: #f3f4f6;
            color: #4b5563;
        }

        .btn-cancel:hover {
            background: #e5e7eb;
        }

        .btn-confirm {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-confirm.danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .btn-confirm.warning {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .btn-confirm:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
    `]
})
export class ConfirmDialogComponent {
    dialogService = inject(DialogService);
}
