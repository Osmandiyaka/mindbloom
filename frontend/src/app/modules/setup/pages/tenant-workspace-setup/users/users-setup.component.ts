import { Component, Injector, OnInit, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { MbSelectOption, MbTableColumn } from '@mindbloom/ui';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from '../tenant-workspace-setup.shared';
import { TenantWorkspaceSetupFacade } from '../tenant-workspace-setup.facade';
import { UserRole, UserRow, UserStatus } from '../tenant-workspace-setup.models';
import { ApiUser, UserSerivce } from './user-serivce.service';

type RolePreviewItem = {
    title: string;
    description?: string;
};

type CreateUserSnapshot = {
    name: string;
    email: string;
    password: string;
    generatePassword: boolean;
    role: UserRole;
    schoolAccess: 'all' | 'selected';
    selectedSchools: string[];
    jobTitle: string;
    department: string;
    gender: string;
    dateOfBirth: string;
    phone: string;
    profilePicture: string | null;
    status: UserStatus;
    notes: string;
};

const HIGH_PRIVILEGE_ROLES: UserRole[] = ['Owner', 'Administrator'];

const ROLE_PREVIEW_MAP: Record<UserRole, RolePreviewItem[]> = {
    Owner: [
        { title: 'Full administrative access', description: 'Manage billing, settings, and security.' },
        { title: 'User & role management', description: 'Create, edit, and revoke access.' },
        { title: 'Data exports', description: 'Export data across the workspace.' },
    ],
    Administrator: [
        { title: 'Workspace management', description: 'Manage settings, users, and configurations.' },
        { title: 'Academic operations', description: 'Edit academic structures and classes.' },
        { title: 'Reporting access', description: 'View and export operational reports.' },
    ],
    Staff: [
        { title: 'Operational workflows', description: 'Manage day-to-day tasks and records.' },
        { title: 'Limited settings', description: 'Access assigned modules only.' },
        { title: 'Reporting access', description: 'View assigned reports.' },
    ],
    Teacher: [
        { title: 'Classroom access', description: 'Manage assigned classes and students.' },
        { title: 'Grading tools', description: 'Enter grades and attendance.' },
        { title: 'Limited administration', description: 'No billing or security permissions.' },
    ],
};

@Component({
    selector: 'app-tenant-users',
    standalone: true,
    imports: [...TENANT_WORKSPACE_SETUP_IMPORTS],
    templateUrl: './users-setup.component.html',
    styleUrls: ['./users-setup.component.scss']
})
export class TenantUsersComponent implements OnInit {
    readonly vm = this;
    private readonly setup = inject(TenantWorkspaceSetupFacade);
    private readonly usersApi = inject(UserSerivce);
    private readonly injector = inject(Injector);

    private initialized = false;
    private syncEnabled = signal(false);
    private userCounter = 0;

    users = signal<UserRow[]>([]);
    userSearch = signal('');
    userMenuOpenId = signal<string | null>(null);
    usersStepSkipped = signal(false);
    canCreateUsers = signal(true);

    isInviteModalOpen = signal(false);
    inviteEmails = signal('');
    inviteEmailInput = signal('');
    inviteRole = signal<UserRole>('Staff');
    inviteRoleIds = signal<string[]>([]);
    inviteSchoolAccess = signal<'all' | 'selected'>('all');
    inviteSelectedSchools = signal<string[]>([]);
    inviteMessage = signal('');
    inviteMessageOpen = signal(false);
    inviteTouched = signal(false);
    inviteSending = signal(false);

    editUserIndex = signal<number | null>(null);
    editName = signal('');
    editEmail = signal('');
    editRole = signal<UserRole>('Staff');
    editSchoolAccess = signal<'all' | 'selected'>('all');
    editSelectedSchools = signal<string[]>([]);
    editJobTitle = signal('');
    editDepartment = signal('');
    editTouched = signal(false);
    isEditUserModalOpen = signal(false);

    createName = signal('');
    createEmail = signal('');
    createRole = signal<UserRole>('Staff');
    createSchoolAccess = signal<'all' | 'selected'>('all');
    createSelectedSchools = signal<string[]>([]);
    createJobTitle = signal('');
    createDepartment = signal('');
    createGender = signal('');
    createDateOfBirth = signal('');
    createPhone = signal('');
    createProfilePicture = signal<string | null>(null);
    createPassword = signal('');
    createGeneratePassword = signal(true);
    createShowPassword = signal(false);
    createSubmitAttempted = signal(false);
    createNameTouched = signal(false);
    createEmailTouched = signal(false);
    createPasswordTouched = signal(false);
    createRoleTouched = signal(false);
    createSchoolAccessTouched = signal(false);
    createAdvancedOpen = signal(false);
    createRolePreviewOpen = signal(false);
    createDiscardOpen = signal(false);
    createNotesOpen = signal(false);
    createRequirePasswordReset = signal(true);
    createSendInviteEmail = signal(true);
    createForceMfa = signal(false);
    createFormSnapshot = signal<CreateUserSnapshot | null>(null);
    createSubmitting = signal(false);
    createStatus = signal<UserStatus>('Active');
    createNotes = signal('');

    isCreateUserModalOpen = signal(false);
    lastCreateRole = signal<UserRole>('Staff');
    lastCreateAccess = signal<'all' | 'selected'>('all');
    isViewUserModalOpen = signal(false);
    viewUser = signal<UserRow | null>(null);

    readonly activeSchoolNames = computed(() => this.setup.activeSchoolNames());

    readonly accountStatusOptions: MbSelectOption[] = [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Suspended' },
    ];

    readonly addUsersMenuItems = computed(() => ([
        { label: 'Invite by email', value: 'invite' },
        {
            label: 'Create user manually',
            value: 'create',
            disabled: !this.canCreateUsers(),
            description: this.canCreateUsers() ? undefined : 'Only workspace owners can create users.',
        },
        { type: 'divider' as const },
        { label: 'Import CSV', value: 'import' },
    ]));

    readonly filteredUsers = computed(() => {
        const query = this.userSearch().trim().toLowerCase();
        if (!query) return this.users();
        return this.users().filter(user =>
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        );
    });

    readonly canContinueUsersStep = computed(() => this.users().length > 0 || this.usersStepSkipped());

    readonly createFormDirty = computed(() => {
        const snapshot = this.createFormSnapshot();
        if (!snapshot) return false;
        const current = this.currentCreateFormState();
        return Object.keys(snapshot).some((key) => {
            const k = key as keyof CreateUserSnapshot;
            const left = snapshot[k];
            const right = current[k];
            if (Array.isArray(left) && Array.isArray(right)) {
                return left.join('|') !== right.join('|');
            }
            return left !== right;
        });
    });

    readonly createInvalidFields = computed(() => {
        if (!this.createSubmitAttempted()) return [];
        const errors: Array<{ id: string; label: string }> = [];
        const nameError = this.createNameError(true);
        const emailError = this.createEmailError(true);
        const passwordError = this.createPasswordError(true);
        const roleError = this.createRoleError(true);
        const accessError = this.createSchoolAccessError(true);
        if (nameError) errors.push({ id: 'create-user-name', label: 'Full name' });
        if (emailError) errors.push({ id: 'create-user-email', label: 'Email' });
        if (passwordError) errors.push({ id: 'create-user-password', label: 'Password' });
        if (roleError) errors.push({ id: 'create-user-role', label: 'Role' });
        if (accessError) errors.push({ id: 'create-user-school-access', label: 'School access' });
        return errors;
    });

    readonly createErrorSummaryText = computed(() => {
        const count = this.createInvalidFields().length;
        if (!count) return '';
        return `Fix ${count} field${count === 1 ? '' : 's'} to continue.`;
    });

    readonly inviteEmailList = computed(() => this.parseEmailList(this.inviteEmails()));
    readonly inviteInvalidEmails = computed(() => this.inviteEmailList().filter(email => !this.isValidEmail(email)));
    readonly inviteDuplicateEmails = computed(() => {
        const seen = new Set<string>();
        return this.inviteEmailList().filter(email => {
            if (seen.has(email)) return true;
            seen.add(email);
            return false;
        });
    });

    readonly inviteHasErrors = computed(() => {
        if (!this.inviteTouched()) return false;
        if (!this.inviteEmailList().length) return true;
        if (this.inviteInvalidEmails().length > 0) return true;
        if (this.inviteDuplicateEmails().length > 0) return true;
        if (this.inviteSchoolAccess() === 'selected' && this.inviteSelectedSchools().length === 0) return true;
        return false;
    });

    readonly inviteCanSubmit = computed(() => {
        if (!this.inviteEmailList().length) return false;
        if (this.inviteInvalidEmails().length > 0) return false;
        if (this.inviteDuplicateEmails().length > 0) return false;
        if (this.inviteSchoolAccess() === 'selected' && this.inviteSelectedSchools().length === 0) return false;
        return true;
    });

    readonly userTableColumns: MbTableColumn<UserRow>[] = [
        {
            key: 'name',
            label: 'Name',
            cell: row => row.name
        },
        {
            key: 'email',
            label: 'Email',
            cell: row => row.email
        },
        {
            key: 'role',
            label: 'Role',
            cell: row => row.role
        },
        {
            key: 'schoolAccess',
            label: 'School access',
            cell: row => this.schoolAccessLabel(row)
        },
        {
            key: 'status',
            label: 'Status',
            cell: row => row.status
        }
    ];

    ngOnInit(): void {
        this.init();
        runInInjectionContext(this.injector, () => {
            effect(() => {
                if (!this.syncEnabled()) return;
                this.setup.users.set(this.users());
                this.setup.usersStepSkipped.set(this.usersStepSkipped());
            }, { allowSignalWrites: true });
        });
    }

    init(): void {
        if (this.initialized) return;
        this.initialized = true;
        const existing = this.setup.users();
        if (existing.length) {
            this.users.set(this.normalizeUserRows(existing));
        }
        this.usersStepSkipped.set(this.setup.usersStepSkipped());
        this.syncEnabled.set(true);
        this.loadUsersFromApi();
    }

    getUserRowIndex(row: UserRow): number {
        return this.users().indexOf(row);
    }

    handleUserCellClick(event: { row: UserRow; column: MbTableColumn<UserRow> }): void {
        if (event.column.key === 'name') {
            const index = this.getUserRowIndex(event.row);
            if (index >= 0) {
                this.openViewUser(index);
            }
        }
    }

    toggleUserMenu(id: string, event?: MouseEvent): void {
        event?.stopPropagation();
        const next = this.userMenuOpenId() === id ? null : id;
        this.userMenuOpenId.set(next);
    }

    userMenuKey(row: UserRow): string {
        return row.id;
    }

    closeUserMenu(): void {
        this.userMenuOpenId.set(null);
    }

    trackUserRow = (_: number, user: UserRow) => user.id;

    openInviteModal(): void {
        this.inviteEmails.set('');
        this.inviteEmailInput.set('');
        this.inviteRole.set('Staff');
        this.inviteRoleIds.set([this.inviteRole()]);
        this.inviteSchoolAccess.set('all');
        this.inviteSelectedSchools.set([]);
        this.inviteMessage.set('');
        this.inviteMessageOpen.set(false);
        this.inviteTouched.set(false);
        this.inviteSending.set(false);
        this.isInviteModalOpen.set(true);
    }

    closeInviteModal(): void {
        this.isInviteModalOpen.set(false);
        this.inviteTouched.set(false);
        this.inviteEmailInput.set('');
        this.inviteSending.set(false);
    }

    openCreateUserModal(): void {
        this.createName.set('');
        this.createEmail.set('');
        const role = this.lastCreateRole() || 'Staff';
        const access = this.lastCreateAccess() || 'all';
        this.createRole.set(role);
        this.createSchoolAccess.set(access);
        this.createSelectedSchools.set([]);
        this.createJobTitle.set('');
        this.createDepartment.set('');
        this.createGender.set('');
        this.createDateOfBirth.set('');
        this.createPhone.set('');
        this.createProfilePicture.set(null);
        this.createPassword.set('');
        this.createGeneratePassword.set(true);
        this.createShowPassword.set(false);
        this.createStatus.set('Active');
        this.createNotes.set('');
        this.createNotesOpen.set(false);
        this.createRequirePasswordReset.set(true);
        this.createSendInviteEmail.set(true);
        this.createForceMfa.set(false);
        this.createSubmitAttempted.set(false);
        this.createNameTouched.set(false);
        this.createEmailTouched.set(false);
        this.createPasswordTouched.set(false);
        this.createRoleTouched.set(false);
        this.createSchoolAccessTouched.set(false);
        this.createAdvancedOpen.set(false);
        this.createRolePreviewOpen.set(false);
        this.createDiscardOpen.set(false);
        this.createSubmitting.set(false);
        this.isCreateUserModalOpen.set(true);
        this.setCreateFormSnapshot();
    }

    requestCloseCreateUserModal(): void {
        if (this.createFormDirty()) {
            this.createDiscardOpen.set(true);
            return;
        }
        this.closeCreateUserModal();
    }

    closeCreateUserModal(): void {
        this.isCreateUserModalOpen.set(false);
        this.createSubmitAttempted.set(false);
        this.createRolePreviewOpen.set(false);
        this.createDiscardOpen.set(false);
        this.createFormSnapshot.set(null);
        this.createSubmitting.set(false);
    }

    closeCreateDiscardModal(): void {
        this.createDiscardOpen.set(false);
    }

    confirmDiscardCreateUser(): void {
        this.createDiscardOpen.set(false);
        this.closeCreateUserModal();
    }

    toggleInviteMessage(): void {
        this.inviteMessageOpen.set(!this.inviteMessageOpen());
    }

    handleInviteKeydown(event: KeyboardEvent): void {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            if (this.inviteCanSubmit()) {
                this.sendInvites();
            }
        }
    }

    onInviteEmailKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
            event.preventDefault();
            this.commitInviteEmailInput();
            return;
        }
        if (event.key === 'Backspace' && !this.inviteEmailInput()) {
            const list = this.inviteEmailList();
            if (!list.length) return;
            this.removeInviteEmail(list.length - 1);
        }
    }

    onInviteEmailPaste(event: ClipboardEvent): void {
        const pasted = event.clipboardData?.getData('text') ?? '';
        if (!pasted.trim()) return;
        event.preventDefault();
        this.addInviteEmails(pasted);
        this.inviteEmailInput.set('');
        this.inviteTouched.set(true);
    }

    onInviteEmailBlur(): void {
        this.inviteTouched.set(true);
        this.commitInviteEmailInput();
    }

    toggleInviteSchoolSelection(name: string, checked: boolean): void {
        this.inviteSelectedSchools.update(items => {
            if (checked) return [...items, name];
            return items.filter(item => item !== name);
        });
    }

    sendInvites(): void {
        if (this.inviteSending()) return;
        this.inviteTouched.set(true);
        this.commitInviteEmailInput();
        if (this.inviteHasErrors()) return;
        this.inviteSending.set(true);
        const emails = this.inviteEmailList();
        const existingEmails = new Set(this.users().map(user => user.email.toLowerCase()));
        const schoolAccess = this.inviteSchoolAccess() === 'all'
            ? 'all'
            : [...this.inviteSelectedSchools()];
        const role = this.inviteRole();
        const newUsers: UserRow[] = emails
            .filter(email => !existingEmails.has(email.toLowerCase()))
            .map(email => ({
                id: this.nextUserId(),
                name: '',
                email,
                role,
                schoolAccess,
                status: 'Invited',
                createdAt: new Date().toISOString(),
            }));
        if (newUsers.length) {
            this.users.update(items => [...items, ...newUsers]);
            this.usersStepSkipped.set(false);
        }
        this.closeInviteModal();
    }

    setInviteRole(value: string): void {
        this.inviteRole.set(this.normalizeRole(value));
    }

    handleInviteRoleChange(event: { ids: string[]; roles?: { name: string }[] }): void {
        this.inviteRoleIds.set(event.ids);
        if (event.roles?.length) {
            this.inviteRole.set(this.normalizeRole(event.roles[0].name));
        }
    }

    isInviteEmailInvalid(email: string): boolean {
        return !this.isValidEmail(email);
    }

    isInviteEmailDuplicate(email: string, index: number): boolean {
        return this.inviteEmailList().indexOf(email) !== index;
    }

    trackInviteEmail(index: number, email: string): string {
        return `${email}-${index}`;
    }

    removeInviteEmail(index: number): void {
        const next = this.inviteEmailList().filter((_, i) => i !== index);
        this.inviteEmails.set(next.join(', '));
    }

    private commitInviteEmailInput(): void {
        const value = this.inviteEmailInput().trim();
        if (!value) return;
        this.addInviteEmails(value);
        this.inviteEmailInput.set('');
    }

    private addInviteEmails(raw: string): void {
        const parsed = this.parseEmailList(raw);
        if (!parsed.length) return;
        const next = [...this.inviteEmailList(), ...parsed];
        this.inviteEmails.set(next.join(', '));
    }

    openViewUser(index: number): void {
        const user = this.users()[index];
        if (!user) return;
        this.viewUser.set(user);
        this.isViewUserModalOpen.set(true);
    }

    closeViewUser(): void {
        this.viewUser.set(null);
        this.isViewUserModalOpen.set(false);
    }

    openEditUser(index: number): void {
        const user = this.users()[index];
        if (!user) return;
        this.editUserIndex.set(index);
        this.editName.set(user.name);
        this.editEmail.set(user.email);
        this.editRole.set(user.role);
        this.editSchoolAccess.set(user.schoolAccess === 'all' ? 'all' : 'selected');
        this.editSelectedSchools.set(Array.isArray(user.schoolAccess) ? [...user.schoolAccess] : []);
        this.editJobTitle.set(user.jobTitle || '');
        this.editDepartment.set(user.department || '');
        this.editTouched.set(false);
        this.isEditUserModalOpen.set(true);
    }

    closeEditUser(): void {
        this.isEditUserModalOpen.set(false);
        this.editTouched.set(false);
        this.editUserIndex.set(null);
    }

    toggleEditSchoolSelection(name: string, checked: boolean): void {
        this.editSelectedSchools.update(items => {
            if (checked) return [...items, name];
            return items.filter(item => item !== name);
        });
    }

    saveUserEdits(): void {
        this.editTouched.set(true);
        const index = this.editUserIndex();
        if (index === null) return;
        const name = this.editName().trim();
        const role = this.editRole();
        if (!name || !role) return;
        const schoolAccess = this.editSchoolAccess() === 'all'
            ? 'all'
            : [...this.editSelectedSchools()];
        this.users.update(items => items.map((user, i) => {
            if (i !== index) return user;
            return {
                ...user,
                name,
                role,
                schoolAccess,
                jobTitle: this.editJobTitle().trim() || undefined,
                department: this.editDepartment().trim() || undefined,
            };
        }));
        this.closeEditUser();
    }

    setEditRole(value: string): void {
        this.editRole.set(this.normalizeRole(value));
    }

    setCreateRole(value: string): void {
        this.createRole.set(this.normalizeRole(value));
        this.createRoleTouched.set(true);
        if (this.createRole()) {
            this.lastCreateRole.set(this.createRole());
        }
    }

    setCreateStatus(value: UserStatus | string): void {
        const normalized: UserStatus = (
            value === 'Active' || value === 'Invited' || value === 'Suspended'
        ) ? value : 'Active';
        this.createStatus.set(normalized);
    }

    setCreateNotes(value: string): void {
        this.createNotes.set(value);
    }

    setCreateDepartment(value: string): void {
        this.createDepartment.set(value);
    }

    toggleCreateAdvanced(): void {
        this.createAdvancedOpen.update(value => !value);
    }

    toggleCreateNotes(): void {
        this.createNotesOpen.update(value => !value);
    }

    toggleCreateRolePreview(): void {
        this.createRolePreviewOpen.update(value => !value);
    }

    closeCreateRolePreview(): void {
        this.createRolePreviewOpen.set(false);
    }

    toggleCreateGeneratePassword(checked: boolean): void {
        this.createGeneratePassword.set(checked);
        if (checked) {
            this.createPassword.set('');
            this.createShowPassword.set(false);
            this.createPasswordTouched.set(false);
        }
    }

    toggleCreateShowPassword(): void {
        if (this.createGeneratePassword()) return;
        this.createShowPassword.update(value => !value);
    }

    setCreateSchoolAccess(value: 'all' | 'selected'): void {
        this.createSchoolAccess.set(value);
        this.createSchoolAccessTouched.set(true);
        this.lastCreateAccess.set(value);
        if (value === 'selected' && this.createSelectedSchools().length === 0) {
            const schools = this.activeSchoolNames();
            if (schools.length === 1) {
                this.createSelectedSchools.set([schools[0]]);
            }
        }
    }

    setCreateSelectedSchools(next: string[]): void {
        this.createSelectedSchools.set([...new Set(next)]);
        this.createSchoolAccessTouched.set(true);
    }

    markCreateSchoolAccessTouched(): void {
        this.createSchoolAccessTouched.set(true);
    }

    onCreateProfilePictureChange(event: Event): void {
        const input = event.target as HTMLInputElement | null;
        const file = input?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            this.createProfilePicture.set(typeof reader.result === 'string' ? reader.result : null);
        };
        reader.readAsDataURL(file);
    }

    removeCreateProfilePicture(): void {
        this.createProfilePicture.set(null);
    }

    createUserInitials(): string {
        const name = this.createName().trim();
        if (!name) return 'U';
        const parts = name.split(' ').filter(Boolean);
        return parts.map(part => part[0]).join('').slice(0, 2).toUpperCase();
    }

    createRoleIsHighPrivilege(): boolean {
        return HIGH_PRIVILEGE_ROLES.includes(this.createRole());
    }

    createRolePreviewItems(): RolePreviewItem[] {
        const role = this.createRole() as UserRole;
        if (ROLE_PREVIEW_MAP[role]) return ROLE_PREVIEW_MAP[role];
        return [
            { title: 'Custom role', description: 'Permissions are defined in the role settings.' },
            { title: 'Scoped access', description: 'Access follows configured scopes.' },
        ];
    }

    createRoleBadge(): string {
        return 'System';
    }

    focusCreateField(id: string): void {
        const element = document.getElementById(id) as HTMLElement | null;
        element?.focus();
    }

    saveCreateUser(): void {
        if (this.createSubmitting()) return;
        this.createSubmitAttempted.set(true);
        const name = this.createName().trim();
        const email = this.createEmail().trim();
        if (!this.createCanSubmit()) return;
        const password = this.createGeneratePassword()
            ? this.generateRandomPassword()
            : this.createPassword().trim();
        if (!password) {
            this.createPasswordTouched.set(true);
            return;
        }
        this.createSubmitting.set(true);
        const schoolAccess = this.createSchoolAccess() === 'all'
            ? 'all'
            : [...this.createSelectedSchools()];
        const payload = {
            name,
            email,
            password,
            profilePicture: this.createProfilePicture() || undefined,
            phone: this.createPhone().trim() || undefined,
            forcePasswordReset: this.createRequirePasswordReset(),
            mfaEnabled: this.createForceMfa(),
        };
        this.usersApi.createUser(payload).subscribe({
            next: (user) => {
                this.users.update(items => [
                    ...items,
                    {
                        id: user.id || this.nextUserId(),
                        name: user.name || name,
                        email: user.email || email,
                        role: this.createRole(),
                        schoolAccess,
                        status: this.createStatus(),
                        jobTitle: this.createJobTitle().trim() || undefined,
                        department: this.createDepartment().trim() || undefined,
                        gender: this.createGender().trim() || undefined,
                        dateOfBirth: this.createDateOfBirth().trim() || undefined,
                        phone: user.phone ?? (this.createPhone().trim() || undefined),
                        profilePicture: user.profilePicture ?? this.createProfilePicture(),
                        notes: this.createNotes().trim() || undefined,
                        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
                    }
                ]);
                this.usersStepSkipped.set(false);
                this.lastCreateRole.set(this.createRole());
                this.lastCreateAccess.set(this.createSchoolAccess());
                this.createSubmitting.set(false);
                this.closeCreateUserModal();
            },
            error: () => {
                this.createSubmitting.set(false);
            }
        });
    }

    private generateRandomPassword(length = 12): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%*?';
        let result = '';
        for (let i = 0; i < length; i += 1) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    createNameError(force = false): string {
        if (!this.shouldShowCreateError(this.createNameTouched(), force)) return '';
        if (!this.createName().trim()) return 'Full name is required.';
        return '';
    }

    createEmailError(force = false): string {
        if (!this.shouldShowCreateError(this.createEmailTouched(), force)) return '';
        const email = this.createEmail().trim();
        if (!email) return 'Email is required.';
        if (!this.isValidEmail(email)) return 'Enter a valid email address.';
        if (this.isCreateEmailDuplicate(email)) return 'Email already exists in this workspace.';
        return '';
    }

    createPasswordError(force = false): string {
        if (this.createGeneratePassword()) return '';
        if (!this.shouldShowCreateError(this.createPasswordTouched(), force)) return '';
        if (!this.createPassword().trim()) {
            return 'Password is required.';
        }
        return '';
    }

    createRoleError(force = false): string {
        if (!this.shouldShowCreateError(this.createRoleTouched(), force)) return '';
        if (!this.createRole()) return 'Role is required.';
        return '';
    }

    createSchoolAccessError(force = false): string {
        if (!this.shouldShowCreateError(this.createSchoolAccessTouched(), force)) return '';
        if (this.createSchoolAccess() === 'selected' && this.createSelectedSchools().length === 0) {
            return 'Select at least one school.';
        }
        return '';
    }

    readonly createCanSubmit = computed(() => {
        if (this.createNameError(true)) return false;
        if (this.createEmailError(true)) return false;
        if (this.createPasswordError(true)) return false;
        if (this.createRoleError(true)) return false;
        if (this.createSchoolAccessError(true)) return false;
        return true;
    });

    resendInvite(index: number): void {
        this.users.update(items => items.map((user, i) => i === index ? { ...user } : user));
    }

    toggleUserStatus(index: number): void {
        this.users.update(items => items.map((user, i) => {
            if (i !== index) return user;
            const status: UserStatus = user.status === 'Suspended' ? 'Active' : 'Suspended';
            return { ...user, status };
        }));
    }

    removeUser(index: number): void {
        this.users.update(items => items.filter((_, i) => i !== index));
    }

    triggerCsvImport(fileInput: HTMLInputElement): void {
        fileInput.click();
    }

    handleCsvImport(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const text = String(reader.result || '');
            const rows = this.parseCsvUsers(text);
            if (rows.length) {
                this.users.update(items => [...items, ...rows]);
                this.usersStepSkipped.set(false);
            }
            input.value = '';
        };
        reader.readAsText(file);
    }

    handleAddUsersAction(action: string, csvInput: HTMLInputElement): void {
        switch (action) {
            case 'invite':
                this.openInviteModal();
                break;
            case 'create':
                if (this.canCreateUsers()) {
                    this.openCreateUserModal();
                }
                break;
            case 'import':
                this.triggerCsvImport(csvInput);
                break;
            default:
                break;
        }
    }

    back(): void {
        this.setup.back();
    }

    next(): void {
        this.setup.next();
    }

    skipUsersStep(): void {
        this.usersStepSkipped.set(true);
        this.setup.attemptedContinue.set(false);
        this.setup.next();
    }

    isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    schoolAccessLabel(user: UserRow): string {
        if (user.schoolAccess === 'all') return 'All schools';
        const count = user.schoolAccess.length;
        return count === 1 ? '1 school' : `${count} schools`;
    }

    private shouldShowCreateError(touched: boolean, force: boolean): boolean {
        return force || this.createSubmitAttempted() || touched;
    }

    private isCreateEmailDuplicate(email: string): boolean {
        const normalized = email.trim().toLowerCase();
        if (!normalized) return false;
        return this.users().some(user => user.email.toLowerCase() === normalized);
    }

    private currentCreateFormState(): CreateUserSnapshot {
        return {
            name: this.createName(),
            email: this.createEmail(),
            password: this.createPassword(),
            generatePassword: this.createGeneratePassword(),
            role: this.createRole(),
            schoolAccess: this.createSchoolAccess(),
            selectedSchools: [...this.createSelectedSchools()].sort(),
            jobTitle: this.createJobTitle(),
            department: this.createDepartment(),
            gender: this.createGender(),
            dateOfBirth: this.createDateOfBirth(),
            phone: this.createPhone(),
            profilePicture: this.createProfilePicture(),
            status: this.createStatus(),
            notes: this.createNotes(),
        };
    }

    private setCreateFormSnapshot(): void {
        this.createFormSnapshot.set(this.currentCreateFormState());
    }

    private parseEmailList(input: string): string[] {
        return input
            .split(/[\n,;\s]+/g)
            .map(value => value.trim())
            .filter(value => value.length > 0);
    }

    private parseCsvUsers(text: string): UserRow[] {
        const rows = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        if (!rows.length) return [];
        const parsed: UserRow[] = [];
        for (const line of rows) {
            const [name, email, role] = line.split(',').map(value => value?.trim() || '');
            if (!email || !this.isValidEmail(email)) continue;
            parsed.push({
                id: this.nextUserId(),
                name,
                email,
                role: this.normalizeRole(role),
                schoolAccess: 'all',
                status: 'Invited',
                createdAt: new Date().toISOString(),
            });
        }
        return parsed;
    }

    private normalizeRole(role: string): UserRole {
        const normalized = role.toLowerCase();
        if (normalized === 'owner') return 'Owner';
        if (normalized === 'administrator' || normalized === 'admin') return 'Administrator';
        if (normalized === 'teacher') return 'Teacher';
        return 'Staff';
    }

    private nextUserId(): string {
        this.userCounter += 1;
        return `user-${this.userCounter}`;
    }

    private normalizeUserRows(rows: UserRow[]): UserRow[] {
        let maxCounter = 0;
        for (const row of rows) {
            const match = row.id?.match(/^user-(\d+)$/);
            if (match) {
                const value = Number(match[1]);
                if (!Number.isNaN(value)) {
                    maxCounter = Math.max(maxCounter, value);
                }
            }
        }
        this.userCounter = Math.max(this.userCounter, maxCounter);
        const seen = new Set<string>();
        return rows.map(row => {
            let id = row.id?.trim() || '';
            if (!id || seen.has(id)) {
                id = this.nextUserId();
            }
            seen.add(id);
            return { ...row, id };
        });
    }

    private loadUsersFromApi(): void {
        this.usersApi.getUsers().subscribe({
            next: (users: ApiUser[]) => {
                if (this.users().length) return;
                const rows: UserRow[] = users.map(user => ({
                    id: user.id,
                    name: user.name || '',
                    email: user.email,
                    role: user.role?.name || 'Staff',
                    schoolAccess: 'all',
                    status: 'Active',
                    profilePicture: user.profilePicture ?? null,
                    phone: user.phone ?? undefined,
                    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
                }));
                this.users.set(this.normalizeUserRows(rows));
            },
            error: () => {
                // API errors shouldn't block setup; keep local state.
            }
        });
    }
}
