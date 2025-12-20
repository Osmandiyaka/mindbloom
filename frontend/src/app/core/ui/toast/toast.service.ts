import { Injectable, signal } from '@angular/core';

export interface UiToast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    toasts = signal<UiToast[]>([]);
    private nextId = 1;

    private push(message: string, type: UiToast['type'] = 'info', duration = 4000) {
        const toast: UiToast = { id: this.nextId++, message, type, duration };
        this.toasts.update(ts => [...ts, toast]);

        if (duration > 0) {
            setTimeout(() => this.remove(toast.id), duration);
        }
    }

    success(msg: string, duration?: number) { this.push(msg, 'success', duration ?? 4000); }
    error(msg: string, duration?: number) { this.push(msg, 'error', duration ?? 6000); }
    warning(msg: string, duration?: number) { this.push(msg, 'warning', duration ?? 4000); }
    info(msg: string, duration?: number) { this.push(msg, 'info', duration ?? 3000); }

    remove(id: number) { this.toasts.update(ts => ts.filter(t => t.id !== id)); }
    clear() { this.toasts.set([]); }
}
