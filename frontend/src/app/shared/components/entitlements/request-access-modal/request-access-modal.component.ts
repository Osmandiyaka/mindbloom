import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiButtonComponent } from '../../../ui/buttons/ui-button.component';
import { UiInputComponent } from '../../../ui/forms/ui-input.component';

@Component({
    selector: 'app-request-access-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, UiButtonComponent, UiInputComponent],
    template: `
        <div class="modal-overlay" *ngIf="open" (click)="close.emit()">
            <div class="modal" (click)="$event.stopPropagation()">
                <div class="modal-header">
                    <div>
                        <h3>Request access</h3>
                        <p>Send a request to enable this module or feature.</p>
                    </div>
                    <ui-button size="sm" variant="ghost" (click)="close.emit()">✕</ui-button>
                </div>
                <div class="modal-body">
                    <label>
                        Module/feature
                        <ui-input [value]="target" [disabled]="true"></ui-input>
                    </label>
                    <label>
                        Reason
                        <textarea rows="3" [(ngModel)]="reason"></textarea>
                    </label>
                </div>
                <div class="modal-footer">
                    <ui-button size="sm" variant="ghost" (click)="close.emit()">Cancel</ui-button>
                    <ui-button size="sm" variant="primary" (click)="submit()">
                        Send request
                    </ui-button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 60;
        }

        .modal {
            width: 420px;
            max-width: 90%;
            background: white;
            border-radius: 12px;
            padding: 18px;
            display: grid;
            gap: 14px;
        }

        .modal-body {
            display: grid;
            gap: 12px;
            font-size: 12px;
        }

        .modal-body textarea {
            width: 100%;
            border-radius: 10px;
            border: 1px solid rgba(148, 163, 184, 0.2);
            padding: 8px 10px;
            font: inherit;
        }

        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }
    `],
})
export class RequestAccessModalComponent {
    @Input() open = false;
    @Input() target = '';
    @Output() close = new EventEmitter<void>();
    @Output() submitRequest = new EventEmitter<{ reason: string }>();

    reason = '';

    submit(): void {
        this.submitRequest.emit({ reason: this.reason });
        this.reason = '';
        this.close.emit();
    }
}
