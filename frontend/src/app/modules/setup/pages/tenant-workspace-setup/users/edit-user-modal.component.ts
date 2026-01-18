import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { MbButtonComponent, MbFormFieldComponent, MbInputComponent, MbSelectComponent } from '@mindbloom/ui';
import { RoleDropdownComponent } from '../../../../../shared/components/role-dropdown/role-dropdown.component';
import { SchoolSelectorComponent, SchoolOption } from '../../../../../shared/components/school-selector/school-selector.component';
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
        RoleDropdownComponent,
        SchoolSelectorComponent,
    ],
    templateUrl: './edit-user-modal.component.html',
    styleUrls: ['./users-setup.component.scss'],
})
export class EditUserModalComponent implements OnChanges {
    @Input() isOpen = false;
    @Input() activeSchools: SchoolOption[] = [];
    @Input() requestState: RequestState = { status: 'idle' };
    @Input() payload: EditUserFormState | null = null;
    @Output() closed = new EventEmitter<void>();
    @Output() submitted = new EventEmitter<EditUserFormState>();

    form = signal<EditUserFormState>({ ...initialFormState });

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isOpen']?.currentValue && this.payload) {
            this.form.set({ ...this.payload });
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
        if (scope === 'selected' && this.form().selectedSchoolIds.length === 0) {
            const first = this.activeSchools[0];
            if (first) {
                this.updateField('selectedSchoolIds', [first.id]);
            }
        }
    }

    submit(): void {
        this.submitted.emit(this.form());
    }
}
