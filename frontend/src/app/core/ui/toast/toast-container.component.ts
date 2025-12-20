import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
    selector: 'host-toast-container',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-root" aria-live="polite" aria-atomic="true">
      <div class="toast" *ngFor="let t of toastSvc.toasts(); trackBy: trackById" [attr.data-type]="t.type">
        <div class="toast-body">{{ t.message }}</div>
        <button class="toast-close" (click)="toastSvc.remove(t.id)" aria-label="Dismiss">✕</button>
      </div>
    </div>
  `,
    styles: [`
    .toast-root {
      position: fixed;
      right: 16px;
      bottom: 18px;
      display: grid;
      gap: 10px;
      z-index: 9999;
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      display: flex;
      gap: 12px;
      align-items: center;
      min-width: 220px;
      max-width: 420px;
      padding: 10px 12px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      box-shadow: 0 6px 18px rgba(0,0,0,0.2);
    }
    .toast[data-type='success'] { background: linear-gradient(90deg, #059669, #10b981); }
    .toast[data-type='error'] { background: linear-gradient(90deg, #ef4444, #dc2626); }
    .toast[data-type='warning'] { background: linear-gradient(90deg, #f59e0b, #f97316); }
    .toast[data-type='info'] { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
    .toast-body { flex: 1; font-weight: 600; }
    .toast-close { background: transparent; border: none; color: rgba(255,255,255,0.9); font-weight: 700; cursor: pointer; }
  `]
})
export class ToastContainerComponent {
    constructor(public toastSvc: ToastService) { }

    trackById(_: number, t: any) { return t.id; }
}
