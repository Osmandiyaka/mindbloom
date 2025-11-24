import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../services/toast.service';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="toast-container">
            @for (toast of toastService.toasts(); track toast.id) {
                <div class="toast" [class]="toast.type" [@slideIn]>
                    <div class="toast-icon">
                        @switch (toast.type) {
                            @case ('success') { ✅ }
                            @case ('error') { ❌ }
                            @case ('warning') { ⚠️ }
                            @case ('info') { ℹ️ }
                        }
                    </div>
                    <div class="toast-message">{{ toast.message }}</div>
                    <button class="toast-close" (click)="toastService.remove(toast.id)">✕</button>
                </div>
            }
        </div>
    `,
    styles: [`
        .toast-container {
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            max-width: 400px;
        }

        .toast {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 1.25rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        .toast.success {
            border-left: 4px solid #10b981;
        }

        .toast.error {
            border-left: 4px solid #ef4444;
        }

        .toast.warning {
            border-left: 4px solid #f59e0b;
        }

        .toast.info {
            border-left: 4px solid #3b82f6;
        }

        .toast-icon {
            font-size: 1.25rem;
            flex-shrink: 0;
        }

        .toast-message {
            flex: 1;
            font-size: 0.9375rem;
            color: #1a1a1a;
        }

        .toast-close {
            background: none;
            border: none;
            font-size: 1.125rem;
            color: #9ca3af;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.2s;
        }

        .toast-close:hover {
            background: #f3f4f6;
            color: #1a1a1a;
        }
    `]
})
export class ToastContainerComponent {
    toastService = inject(ToastService);
}
