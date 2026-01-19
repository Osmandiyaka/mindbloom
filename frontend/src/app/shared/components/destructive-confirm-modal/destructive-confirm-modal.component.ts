import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { MbButtonComponent, MbInputComponent, MbModalComponent, MbModalFooterDirective } from '@mindbloom/ui';

@Component({
    selector: 'app-destructive-confirm-modal',
    standalone: true,
    imports: [CommonModule, MbModalComponent, MbModalFooterDirective, MbButtonComponent, MbInputComponent],
    templateUrl: './destructive-confirm-modal.component.html',
    styleUrls: ['./destructive-confirm-modal.component.scss'],
})
export class DestructiveConfirmModalComponent {
    @Input() open = false;
    @Input() title = 'Confirm action';
    @Input() description = '';
    @Input() impactTitle = '';
    @Input() impactItems: string[] = [];
    @Input() requireConfirmation = false;
    @Input() confirmationLabel = '';
    @Input() confirmationPlaceholder = 'Type to confirm';
    @Input() confirmText = '';
    @Input() confirmButtonLabel = 'Confirm';
    @Input() cancelButtonLabel = 'Cancel';
    @Input() isProcessing = false;

    @Output() closed = new EventEmitter<void>();
    @Output() confirmed = new EventEmitter<string>();

    confirmationValue = signal('');

    handleClosed(): void {
        this.confirmationValue.set('');
        this.closed.emit();
    }

    canConfirm(): boolean {
        if (!this.requireConfirmation) return true;
        return this.confirmationValue().trim().toLowerCase() === this.confirmText.trim().toLowerCase();
    }

    confirm(): void {
        if (!this.canConfirm()) return;
        this.confirmed.emit(this.confirmationValue().trim());
    }
}
