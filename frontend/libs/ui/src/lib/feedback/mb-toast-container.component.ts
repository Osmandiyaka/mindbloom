import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MbToastService } from './mb-toast.service';

@Component({
    selector: 'mb-toast-container',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="mb-toast-container" aria-live="polite" aria-atomic="true">
            <div *ngFor="let toast of toasts()" class="mb-toast" [class.mb-toast--success]="toast.variant === 'success'" [class.mb-toast--warning]="toast.variant === 'warning'" [class.mb-toast--danger]="toast.variant === 'danger'">
                <div class="mb-toast__content">
                    <div class="mb-toast__title" *ngIf="toast.title">{{ toast.title }}</div>
                    <div class="mb-toast__message">{{ toast.message }}</div>
                </div>
                <button type="button" class="mb-toast__close" (click)="dismiss(toast.id)" aria-label="Dismiss toast">
                    &times;
                </button>
            </div>
        </div>
    `,
    styleUrls: ['./mb-toast.component.scss']
})
export class MbToastContainerComponent {
    private readonly service = inject(MbToastService);
    readonly toasts = computed(() => this.service.toasts());

    dismiss(id: string): void {
        this.service.dismiss(id);
    }
}
