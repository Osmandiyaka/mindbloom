import { Injectable, signal } from '@angular/core';

export type MbToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface MbToast {
    id: string;
    title?: string;
    message: string;
    variant: MbToastVariant;
    duration: number;
}

@Injectable({ providedIn: 'root' })
export class MbToastService {
    readonly toasts = signal<MbToast[]>([]);

    show(message: string, options?: Partial<Omit<MbToast, 'id' | 'message'>>): string {
        const id = `mb-toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const toast: MbToast = {
            id,
            message,
            title: options?.title,
            variant: options?.variant ?? 'info',
            duration: options?.duration ?? 4000
        };
        this.toasts.update(list => [...list, toast]);
        if (toast.duration > 0) {
            setTimeout(() => this.dismiss(id), toast.duration);
        }
        return id;
    }

    dismiss(id: string): void {
        this.toasts.update(list => list.filter(t => t.id !== id));
    }

    clear(): void {
        this.toasts.set([]);
    }
}
