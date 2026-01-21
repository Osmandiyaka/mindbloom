import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import {
    MbInputComponent,
    MbPopoverComponent
} from '@mindbloom/ui';
import { AcademicLevel } from '../../../../core/services/academic-levels-api.service';

@Component({
    selector: 'app-academic-levels-table',
    standalone: true,
    imports: [CommonModule, OverlayModule, MbInputComponent, MbPopoverComponent],
    templateUrl: './academic-levels-table.component.html',
    styleUrls: ['./academic-levels-table.component.scss']
})
export class AcademicLevelsTableComponent implements OnChanges {
    @Input() levels: AcademicLevel[] = [];
    @Input() focusRowId?: string | null = null;
    @Input() showGroupColumn = true;
    @Input() showCodeColumn = true;
    @Input() reorderMode = false;
    @Input() reorderSaving = false;
    @Input() autosaveStatuses: Record<string, { status: 'saving' | 'saved' | 'error'; message?: string }> = {};
    @Input() validationWarnings: Record<string, { name?: string; code?: string }> = {};

    @Output() inlineEdit = new EventEmitter<{ id: string; field: 'name' | 'code' | 'group'; value: string }>();
    @Output() requestArchive = new EventEmitter<AcademicLevel>();
    @Output() requestRestore = new EventEmitter<AcademicLevel>();
    @Output() requestDelete = new EventEmitter<AcademicLevel>();
    @Output() requestReorder = new EventEmitter<{ id: string; direction: 'up' | 'down' }>();

    editingCell = signal<{ id: string; field: 'name' | 'code' | 'group' } | null>(null);
    rowMenuOpenId = signal<string | null>(null);
    drafts = signal<Record<string, Partial<AcademicLevel>>>({});

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['focusRowId'] && this.focusRowId) {
            this.startEditing(this.focusRowId, 'name');
        }
    }

    isEditing(id: string, field: 'name' | 'code' | 'group'): boolean {
        const editing = this.editingCell();
        return Boolean(editing && editing.id === id && editing.field === field);
    }

    getDraftValue(level: AcademicLevel, field: 'name' | 'code' | 'group'): string {
        return this.drafts()[level.id]?.[field] ?? (level[field] ?? '') ?? '';
    }

    startEditing(id: string, field: 'name' | 'code' | 'group'): void {
        this.editingCell.set({ id, field });
        this.drafts.update(previous => ({
            ...previous,
            [id]: {
                ...previous[id],
                [field]: this.levels.find(level => level.id === id)?.[field] ?? ''
            }
        }));
    }

    updateDraft(id: string, field: 'name' | 'code' | 'group', value: string): void {
        this.drafts.update(previous => ({
            ...previous,
            [id]: {
                ...previous[id],
                [field]: value
            }
        }));
    }

    cancelEdit(): void {
        this.editingCell.set(null);
    }

    commitEdit(id: string, field: 'name' | 'code' | 'group'): void {
        const draft = this.drafts()[id]?.[field] ?? '';
        const trimmed = draft.trim();
        const original = this.levels.find(level => level.id === id)?.[field] ?? '';
        if (trimmed === original) {
            this.cancelEdit();
            return;
        }
        this.inlineEdit.emit({ id, field, value: trimmed });
        this.cancelEdit();
    }

    emitReorder(id: string, direction: 'up' | 'down'): void {
        this.requestReorder.emit({ id, direction });
    }

    toggleRowMenu(id: string, event: Event): void {
        event.stopPropagation();
        this.rowMenuOpenId.update(current => (current === id ? null : id));
    }

    handleArchive(level: AcademicLevel): void {
        this.rowMenuOpenId.set(null);
        this.requestArchive.emit(level);
    }

    handleRestore(level: AcademicLevel): void {
        this.rowMenuOpenId.set(null);
        this.requestRestore.emit(level);
    }

    handleDelete(level: AcademicLevel): void {
        this.rowMenuOpenId.set(null);
        this.requestDelete.emit(level);
    }

    statusLabel(status: 'saving' | 'saved' | 'error'): string {
        switch (status) {
            case 'saving':
                return 'Saving…';
            case 'saved':
                return 'Saved';
            case 'error':
                return 'Error';
        }
    }
}
