import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import {
    MbButtonComponent,
    MbFormFieldComponent,
    MbInputComponent,
    MbModalComponent,
    MbModalFooterDirective,
} from '@mindbloom/ui';
import { AcademicLevelTemplateOption } from '../../../../core/services/academic-levels-api.service';

@Component({
    selector: 'app-add-academic-level-modal',
    standalone: true,
    imports: [CommonModule, MbModalComponent, MbModalFooterDirective, MbButtonComponent, MbFormFieldComponent, MbInputComponent],
    templateUrl: './add-academic-level-modal.component.html',
    styleUrls: ['./add-academic-level-modal.component.scss']
})
export class AddAcademicLevelModalComponent implements OnChanges {
    @Input() open = false;
    @Input() template: AcademicLevelTemplateOption | null = null;
    @Input() isSubmitting = false;
    @Input() errorMessage?: string;

    @Output() closed = new EventEmitter<void>();
    @Output() submit = new EventEmitter<{ name: string; code?: string; group?: string }>();

    name = signal('');
    code = signal('');
    group = signal('');

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['open'] && !this.open) {
            this.reset();
        }
    }

    handleClose(): void {
        this.reset();
        this.closed.emit();
    }

    handleSubmit(): void {
        const name = this.name().trim();
        if (!name) return;
        this.submit.emit({
            name,
            code: this.code().trim() || undefined,
            group: this.group().trim() || undefined
        });
    }

    private reset(): void {
        this.name.set('');
        this.code.set('');
        this.group.set('');
    }
}
