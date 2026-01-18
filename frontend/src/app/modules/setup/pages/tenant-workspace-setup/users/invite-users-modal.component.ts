import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, signal } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { MbButtonComponent, MbCheckboxComponent, MbFormFieldComponent, MbInputComponent, MbPopoverComponent, MbRoleSelectorComponent, MbSchoolSelectorComponent, MbTextareaComponent, type MbSchoolSelectorOption } from '@mindbloom/ui';
import { createDirtyTracker } from './dirty-tracker';
import { dedupeEmails, parseEmailList } from './user-input.parsers';
import { validateInviteUsers } from './user-form.validation';
import { InviteUsersFormState, RequestState } from './users.types';

const initialFormState: InviteUsersFormState = {
    emailInput: '',
    emails: [],
    roleId: null,
    roleName: null,
    roleIds: [],
    schoolAccessScope: 'all',
    selectedSchoolIds: [],
    message: '',
    messageOpen: false,
};

@Component({
    selector: 'app-invite-users-modal',
    standalone: true,
    imports: [
        CommonModule,
        A11yModule,
        MbButtonComponent,
        MbCheckboxComponent,
        MbFormFieldComponent,
        MbInputComponent,
        MbTextareaComponent,
        MbPopoverComponent,
        MbRoleSelectorComponent,
        MbSchoolSelectorComponent,
    ],
    templateUrl: './invite-users-modal.component.html',
    styleUrls: ['./users-setup.component.scss'],
})
export class InviteUsersModalComponent implements OnChanges {
    @Input() isOpen = false;
    @Input() activeSchools: MbSchoolSelectorOption[] = [];
    @Input() existingEmails: string[] = [];
    @Input() requestState: RequestState = { status: 'idle' };
    @Output() closed = new EventEmitter<void>();
    @Output() submitted = new EventEmitter<InviteUsersFormState>();

    form = signal<InviteUsersFormState>({ ...initialFormState });
    touched = signal<Record<string, boolean>>({});
    validation = signal<ReturnType<typeof validateInviteUsers> | null>(null);

    private readonly dirtyTracker = createDirtyTracker(this.form);

    errorSummaryText = computed(() => {
        const summary = this.validation()?.summary ?? [];
        if (!summary.length) return '';
        return `Fix ${summary.length} field${summary.length === 1 ? '' : 's'} to continue.`;
    });

    invalidFields = computed(() => this.validation()?.summary ?? []);

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isOpen']?.currentValue) {
            this.open();
        }
    }

    open(): void {
        this.form.set({ ...initialFormState });
        this.touched.set({});
        this.validation.set(null);
        this.dirtyTracker.resetSnapshot();
    }

    close(): void {
        if (this.dirtyTracker.isDirty()) {
            this.closed.emit();
            return;
        }
        this.closed.emit();
    }

    updateField<K extends keyof InviteUsersFormState>(key: K, value: InviteUsersFormState[K]): void {
        this.form.update(state => ({ ...state, [key]: value }));
    }

    markTouched(field: string): void {
        this.touched.update(state => ({ ...state, [field]: true }));
    }

    commitEmailInput(): void {
        const value = this.form().emailInput.trim();
        if (!value) return;
        const parsed = parseEmailList(value);
        if (!parsed.length) return;
        const next = [...this.form().emails, ...parsed];
        const { unique } = dedupeEmails(next);
        this.updateField('emails', unique);
        this.updateField('emailInput', '');
        this.markTouched('invite-emails');
    }

    removeEmail(index: number): void {
        const next = this.form().emails.filter((_, i) => i !== index);
        this.updateField('emails', next);
    }

    handleEmailKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
            event.preventDefault();
            this.commitEmailInput();
            return;
        }
        if (event.key === 'Backspace' && !this.form().emailInput) {
            const list = this.form().emails;
            if (!list.length) return;
            this.removeEmail(list.length - 1);
        }
    }

    handleEmailPaste(event: ClipboardEvent): void {
        const pasted = event.clipboardData?.getData('text') ?? '';
        if (!pasted.trim()) return;
        event.preventDefault();
        const parsed = parseEmailList(pasted);
        const next = [...this.form().emails, ...parsed];
        const { unique } = dedupeEmails(next);
        this.updateField('emails', unique);
        this.updateField('emailInput', '');
        this.markTouched('invite-emails');
    }

    handleEmailBlur(): void {
        this.markTouched('invite-emails');
        this.commitEmailInput();
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
        this.commitEmailInput();
        const result = validateInviteUsers(this.form(), { existingEmails: this.existingEmails });
        this.validation.set(result);
        if (!result.canSubmit) return;
        this.submitted.emit(this.form());
    }

    errorFor(fieldId: string): string {
        const errors = this.validation()?.fieldErrors ?? {};
        if (!this.touched()[fieldId] && !errors[fieldId]) return '';
        return errors[fieldId] || '';
    }
}
