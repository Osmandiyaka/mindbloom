import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { MbButtonComponent, MbFormFieldComponent, MbInputComponent, MbRoleSelectorComponent, MbSchoolSelectorComponent, MbSelectComponent } from '@mindbloom/ui';
import { EditUserFormState, RequestState } from './users.types';

const initialFormState: EditUserFormState = {
    id: '',
    name: '',
    roleId: null,
    roleName: null,
    schoolAccessScope: 'all',
    selectedSchoolIds: [],
    jobTitle: '',
    department: '',
};

@Component({
    selector: 'app-edit-user-modal',
    standalone: true,
    imports: [
        CommonModule,
        MbButtonComponent,
        MbFormFieldComponent,
        MbInputComponent,
        MbSelectComponent,
        MbRoleSelectorComponent,
        MbSchoolSelectorComponent,
    ],
    templateUrl: './edit-user-modal.component.html',
    styleUrls: ['./users-setup.component.scss'],
})
export class EditUserModalComponent implements OnChanges {
    @Input() isOpen = false;
    @Input() requestState: RequestState = { status: 'idle' };
    @Input() payload: EditUserFormState | null = null;
    @Output() closed = new EventEmitter<void>();
    @Output() submitted = new EventEmitter<EditUserFormState>();

    form = signal<EditUserFormState>({ ...initialFormState });
    selectedRoleIds = signal<string[]>([]);

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isOpen']?.currentValue && this.payload) {
            this.form.set({ ...this.payload });
            this.selectedRoleIds.set(this.payload.roleId ? [this.payload.roleId] : []);
        }
    }

    open(payload: EditUserFormState): void {
        this.form.set({ ...payload });
    }

    updateField<K extends keyof EditUserFormState>(key: K, value: EditUserFormState[K]): void {
        this.form.update(state => ({ ...state, [key]: value }));
    }

    setSchoolAccess(scope: 'all' | 'selected'): void {
        this.updateField('schoolAccessScope', scope);
    }

    submit(): void {
        this.submitted.emit(this.form());
    }

    handleRoleSelection(selection: { ids: string[]; roles?: Array<{ id: string; name: string }> }): void {
        const name = selection.roles?.[0]?.name ?? null;
        this.updateField('roleId', selection.ids[0] ?? null);
        this.updateField('roleName', name);
        this.selectedRoleIds.set(selection.ids);
    }
}
