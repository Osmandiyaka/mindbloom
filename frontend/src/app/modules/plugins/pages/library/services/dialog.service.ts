import { Injectable, signal } from '@angular/core';

export interface ConfirmDialog {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
}

@Injectable({
    providedIn: 'root'
})
export class DialogService {
    activeDialog = signal<ConfirmDialog | null>(null);

    confirm(config: ConfirmDialog) {
        this.activeDialog.set({
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            type: 'info',
            ...config
        });
    }

    confirmDelete(message: string, onConfirm: () => void) {
        this.confirm({
            title: 'Confirm Delete',
            message,
            confirmText: 'Delete',
            type: 'danger',
            onConfirm
        });
    }

    close() {
        this.activeDialog.set(null);
    }

    handleConfirm() {
        const dialog = this.activeDialog();
        if (dialog) {
            dialog.onConfirm();
            this.close();
        }
    }

    handleCancel() {
        const dialog = this.activeDialog();
        if (dialog?.onCancel) {
            dialog.onCancel();
        }
        this.close();
    }
}
