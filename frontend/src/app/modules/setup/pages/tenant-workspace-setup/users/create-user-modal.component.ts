import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, signal } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { MbButtonComponent, MbCheckboxComponent, MbFormFieldComponent, MbInputComponent, MbModalComponent, MbModalFooterDirective, MbPopoverComponent, MbSelectComponent, MbTextareaComponent, MbTooltipDirective } from '@mindbloom/ui';
import { RoleDropdownComponent } from '../../../../../shared/components/role-dropdown/role-dropdown.component';
import { SchoolSelectorComponent, SchoolOption } from '../../../../../shared/components/school-selector/school-selector.component';
import { RolePreviewComponent } from '../role-preview.component';
import { createDirtyTracker } from './dirty-tracker';
import { getRoleBadge, getRolePreviewItems, isHighPrivilegeRole } from './role-preview';
import { validateCreateUser } from './user-form.validation';
import { CreateUserFormState, CreateUserUiState, RequestState, UserStatus } from './users.types';

const initialFormState: CreateUserFormState = {
    name: '',
    email: '',
    phone: '',
    password: '',
    roleId: null,
    roleName: '',
    schoolAccessScope: 'all',
    selectedSchoolIds: [],
    profilePicture: null,
    status: 'active',
    jobTitle: '',
    department: '',
    gender: '',
    dateOfBirth: '',
    notes: '',
    forcePasswordReset: true,
    sendInviteEmail: true,
    forceMfa: false,
    generatePassword: true,
};

const initialUiState: CreateUserUiState = {
    showPassword: false,
    advancedOpen: false,
    rolePreviewOpen: false,
    discardOpen: false,
    notesOpen: false,
};

@Component({
    selector: 'app-create-user-modal',
    standalone: true,
    imports: [
        CommonModule,
        A11yModule,
        MbButtonComponent,
        MbCheckboxComponent,
        MbFormFieldComponent,
        MbInputComponent,
        MbModalComponent,
        MbModalFooterDirective,
        MbSelectComponent,
        MbTextareaComponent,
        MbPopoverComponent,
        MbTooltipDirective,
        RoleDropdownComponent,
        SchoolSelectorComponent,
        RolePreviewComponent,
    ],
    templateUrl: './create-user-modal.component.html',
    styleUrls: ['./users-setup.component.scss'],
})
export class CreateUserModalComponent implements OnChanges {
    @Input() isOpen = false;
    @Input() activeSchools: SchoolOption[] = [];
    @Input() existingEmails: string[] = [];
    @Input() requestState: RequestState = { status: 'idle' };
    @Output() closed = new EventEmitter<void>();
    @Output() submitted = new EventEmitter<CreateUserFormState>();

    form = signal<CreateUserFormState>({ ...initialFormState });
    ui = signal<CreateUserUiState>({ ...initialUiState });
    touched = signal<Record<string, boolean>>({});
    validation = signal<ReturnType<typeof validateCreateUser> | null>(null);

    private readonly dirtyTracker = createDirtyTracker(this.form);

    errorSummaryText = computed(() => {
        const summary = this.validation()?.summary ?? [];
        if (!summary.length) return '';
        return `Fix ${summary.length} field${summary.length === 1 ? '' : 's'} to continue.`;
    });

    invalidFields = computed(() => this.validation()?.summary ?? []);

    isDirty = computed(() => this.dirtyTracker.isDirty());

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isOpen']?.currentValue) {
            this.open();
        }
    }

    open(): void {
        this.form.set({ ...initialFormState });
        this.ui.set({ ...initialUiState });
        this.touched.set({});
        this.validation.set(null);
        this.dirtyTracker.resetSnapshot();
    }

    close(): void {
        if (this.isDirty()) {
            this.ui.update(state => ({ ...state, discardOpen: true }));
            return;
        }
        this.closed.emit();
    }

    confirmDiscard(): void {
        this.ui.update(state => ({ ...state, discardOpen: false }));
        this.closed.emit();
    }

    cancelDiscard(): void {
        this.ui.update(state => ({ ...state, discardOpen: false }));
    }

    updateField<K extends keyof CreateUserFormState>(key: K, value: CreateUserFormState[K]): void {
        this.form.update(state => ({ ...state, [key]: value }));
    }

    markTouched(field: string): void {
        this.touched.update(state => ({ ...state, [field]: true }));
    }

    togglePasswordVisibility(): void {
        if (this.form().generatePassword) return;
        this.ui.update(state => ({ ...state, showPassword: !state.showPassword }));
    }

    toggleAdvanced(): void {
        this.ui.update(state => ({ ...state, advancedOpen: !state.advancedOpen }));
    }

    toggleNotes(): void {
        this.ui.update(state => ({ ...state, notesOpen: !state.notesOpen }));
    }

    toggleRolePreview(): void {
        this.ui.update(state => ({ ...state, rolePreviewOpen: !state.rolePreviewOpen }));
    }

    closeRolePreview(): void {
        this.ui.update(state => ({ ...state, rolePreviewOpen: false }));
    }

    setStatus(value: string): void {
        if (value === 'active' || value === 'suspended' || value === 'invited') {
            this.updateField('status', value as UserStatus);
        }
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
        const result = validateCreateUser(this.form(), { existingEmails: this.existingEmails });
        this.validation.set(result);
        if (!result.canSubmit) return;
        this.submitted.emit(this.form());
    }

    errorFor(fieldId: string): string {
        const errors = this.validation()?.fieldErrors ?? {};
        if (!this.touched()[fieldId] && !errors[fieldId]) return '';
        return errors[fieldId] || '';
    }

    rolePreviewItems = computed(() => getRolePreviewItems(this.form().roleName || ''));
    roleBadge = computed(() => getRoleBadge(this.form().roleName || ''));
    roleIsHighPrivilege = computed(() => isHighPrivilegeRole(this.form().roleName || ''));

    onProfilePictureChange(event: Event): void {
        const input = event.target as HTMLInputElement | null;
        const file = input?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            this.updateField('profilePicture', typeof reader.result === 'string' ? reader.result : null);
        };
        reader.readAsDataURL(file);
    }

    removeProfilePicture(): void {
        this.updateField('profilePicture', null);
    }
}
