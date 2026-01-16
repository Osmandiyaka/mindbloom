import { Component, EnvironmentInjector, OnInit, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
    MbAlertComponent,
    MbButtonComponent,
    MbCardComponent,
    MbClassSelectorComponent,
    MbCheckboxComponent,
    MbFormFieldComponent,
    MbInputComponent,
    MbModalComponent,
    MbModalFooterDirective,
    MbPopoverComponent,
    MbRoleSelectorComponent,
    MbSelectComponent,
    MbSplitButtonComponent,
    MbStaffSelectorComponent,
    MbTableActionsDirective,
    MbTableComponent,
    MbTableColumn,
    MbTextareaComponent,
} from '@mindbloom/ui';
import { AddressComponent, AddressValue } from '../../../../shared/components/address/address.component';
import { COUNTRY_OPTIONS, CountrySelectComponent } from '../../../../shared/components/country-select/country-select.component';
import { TIMEZONE_OPTIONS, TimezoneSelectComponent } from '../../../../shared/components/timezone-select/timezone-select.component';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { TenantSettingsService } from '../../../../core/services/tenant-settings.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { SchoolService } from '../../../../core/school/school.service';
import { FirstLoginSetupService, FirstLoginSetupState } from '../../../../core/services/first-login-setup.service';
import { ToastService } from '../../../../core/ui/toast/toast.service';
import { ClassSectionService } from '../../../../core/services/class-section.service';

interface SchoolRow {
    name: string;
    code: string;
    country: string;
    timezone: string;
    status: 'Active' | 'Inactive';
    address?: AddressValue;
}

type UserRole = 'Owner' | 'Administrator' | 'Staff' | 'Teacher';
type UserStatus = 'Invited' | 'Active' | 'Suspended';

interface UserRow {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    schoolAccess: 'all' | string[];
    status: UserStatus;
    jobTitle?: string;
    department?: string;
    staffId?: string;
    lastLogin?: string;
    createdAt?: string;
}

type ClassLevelType = 'Early Years' | 'Primary' | 'JHS' | 'SHS' | 'College' | 'Other';

interface ClassRow {
    id: string;
    name: string;
    code?: string;
    levelType?: ClassLevelType | '';
    sortOrder: number;
    active: boolean;
    schoolIds: string[] | null;
    notes?: string;
}

interface SectionRow {
    id: string;
    classId: string;
    name: string;
    code?: string;
    capacity?: number | null;
    homeroomTeacherId?: string | null;
    active: boolean;
    sortOrder: number;
}

type OrgUnitStatus = 'Active' | 'Inactive';
type OrgUnitType = 'District' | 'School' | 'Division' | 'Department' | 'Grade' | 'Section' | 'Custom';

type OrgUnitRole = {
    id: string;
    name: string;
    description?: string;
};

interface OrgUnit {
    id: string;
    name: string;
    type: OrgUnitType;
    status: OrgUnitStatus;
    parentId?: string | null;
}

interface OrgUnitNode extends OrgUnit {
    children: OrgUnitNode[];
}

type GradingScaleType = 'Letter' | 'Percent' | 'GPA' | 'Rubric';
type GradingScaleStatus = 'Active' | 'Draft' | 'Archived';

type GradingBand = {
    id: string;
    label: string;
    min: number;
    max: number;
    pass: boolean;
    gpa?: number | null;
};

type GradingScaleSettings = {
    passMark: number | null;
    allowDecimals: boolean;
    preventOverlap: boolean;
    calculationMethod: 'Average' | 'Highest' | 'Lowest' | 'Weighted';
    rounding: 'Nearest' | 'Up' | 'Down';
    showGpa: boolean;
    showPercent: boolean;
    transcriptFormat: 'Letter' | 'Letter + Percent' | 'Percent';
};

type GradingScale = {
    id: string;
    name: string;
    type: GradingScaleType;
    status: GradingScaleStatus;
    schoolIds: string[] | null;
    bands: GradingBand[];
    settings: GradingScaleSettings;
};

type OrgUnitDeleteImpact = {
    childUnits: number;
    members: number;
    roles: number;
};

interface FirstLoginSetupData {
    schoolRows?: SchoolRow[];
    departments?: string[];
    orgUnits?: OrgUnit[];
    orgUnitMemberIds?: Record<string, string[]>;
    orgUnitRoles?: Record<string, OrgUnitRole[]>;
    levelsTemplate?: 'k12' | 'primary_secondary' | 'custom';
    levels?: string[];
    classes?: ClassRow[] | Array<{ name: string; level: string; sections: string }>;
    sections?: SectionRow[];
    gradingModel?: 'letter' | 'numeric' | 'gpa' | 'custom';
    gradingScales?: GradingScale[];
    users?: UserRow[];
    usersStepSkipped?: boolean;
}

@Component({
    selector: 'app-tenant-workspace-setup',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        A11yModule,
        DragDropModule,
        MbCardComponent,
        MbButtonComponent,
        MbClassSelectorComponent,
        MbFormFieldComponent,
        MbInputComponent,
        MbModalComponent,
        MbModalFooterDirective,
        MbPopoverComponent,
        MbRoleSelectorComponent,
        MbSelectComponent,
        MbSplitButtonComponent,
        MbStaffSelectorComponent,
        MbAlertComponent,
        MbTableComponent,
        MbTableActionsDirective,
        MbTextareaComponent,
        MbCheckboxComponent,
        AddressComponent,
        CountrySelectComponent,
        TimezoneSelectComponent,
        SearchInputComponent,
    ],
    templateUrl: './tenant-workspace-setup.component.html',
    styleUrls: ['./tenant-workspace-setup.component.scss']
})
export class TenantWorkspaceSetupComponent implements OnInit {
    private readonly tenantSettings = inject(TenantSettingsService);
    private readonly tenantService = inject(TenantService);
    private readonly schoolService = inject(SchoolService);
    private readonly setupStore = inject(FirstLoginSetupService);
    private readonly router = inject(Router);
    private readonly injector = inject(EnvironmentInjector);
    private readonly toast = inject(ToastService);
    private readonly classSectionService = inject(ClassSectionService);

    private autosaveInitialized = false;

    step = signal<number>(0);
    isLoading = signal(true);
    isSaving = signal(false);
    attemptedContinue = signal(false);
    errorMessage = signal('');

    tenantId = signal<string>('');
    tenantName = signal<string>('');
    country = signal<string>('');
    defaultTimezone = signal<string>('');
    tenantAddress = signal<AddressValue | null>(null);

    schoolRows = signal<SchoolRow[]>([]);
    isSchoolModalOpen = signal(false);
    editingSchoolIndex = signal<number | null>(null);
    schoolFormName = signal('');
    schoolFormCode = signal('');
    schoolFormCountry = signal('');
    schoolFormTimezone = signal('');
    schoolFormTouched = signal(false);
    schoolFormCodeTouched = signal(false);
    schoolFormAddress = signal<AddressValue>({});
    schoolMenuOpenIndex = signal<number | null>(null);

    orgUnits = signal<OrgUnit[]>([]);
    orgUnitMemberIds = signal<Record<string, string[]>>({});
    orgUnitRoles = signal<Record<string, OrgUnitRole[]>>({});
    activeOrgUnitId = signal<string | null>(null);
    expandedOrgUnitIds = signal<string[]>([]);
    activeOrgUnitTab = signal<'members' | 'roles'>('members');
    orgUnitMemberSearch = signal('');
    orgUnitRoleSearch = signal('');
    orgUnitFormOpen = signal(false);
    orgUnitFormName = signal('');
    orgUnitFormType = signal<OrgUnitType>('Department');
    orgUnitFormStatus = signal<OrgUnitStatus>('Active');
    orgUnitFormParentId = signal<string | null>(null);
    orgUnitFormError = signal('');
    assignMembersOpen = signal(false);
    assignMemberIds = signal<string[]>([]);
    assignRolesOpen = signal(false);
    assignRoleIds = signal<string[]>([]);
    assignRoleDraft = signal<OrgUnitRole[]>([]);
    isOrgUnitDeleteOpen = signal(false);
    orgUnitDeleteTarget = signal<OrgUnit | null>(null);
    orgUnitDeleteImpact = signal<OrgUnitDeleteImpact | null>(null);
    orgUnitDeleteImpactLoading = signal(false);
    orgUnitDeleteConfirm = signal('');
    orgUnitDeleteError = signal('');
    orgUnitDeleteSubmitting = signal(false);
    isOrgUnitRenameOpen = signal(false);
    orgUnitRenameName = signal('');
    orgUnitRenameError = signal('');
    orgUnitRenameSubmitting = signal(false);
    isOrgUnitMoveOpen = signal(false);
    isOrgUnitChangeParentOpen = signal(false);
    orgUnitMoveTarget = signal<OrgUnit | null>(null);
    orgUnitMoveParentId = signal<string | null>(null);
    orgUnitMoveError = signal('');
    orgUnitMoveSubmitting = signal(false);
    isOrgUnitDeactivateOpen = signal(false);
    orgUnitDeactivateError = signal('');
    orgUnitDeactivateSubmitting = signal(false);
    ouActionsMenuOpen = signal(false);

    levelsTemplate = signal<'k12' | 'primary_secondary' | 'custom'>('k12');
    levels = signal<string[]>(this.defaultLevels('k12'));
    classRows = signal<ClassRow[]>([]);
    sectionRows = signal<SectionRow[]>([]);
    selectedClassId = signal<string | null>(null);
    classSearch = signal('');
    classSort = signal<'az' | 'recent'>('az');
    classSchoolFilter = signal<string>('all');
    classFormOpen = signal(false);
    classFormMode = signal<'add' | 'edit' | 'view'>('add');
    classMenuOpenId = signal<string | null>(null);
    classHeaderMenuOpen = signal(false);
    sectionsMenuOpen = signal(false);
    sectionMenuOpenId = signal<string | null>(null);
    classFormId = signal<string | null>(null);
    classFormName = signal('');
    classFormCode = signal('');
    classFormLevel = signal<ClassLevelType | ''>('');
    classFormNotes = signal('');
    classFormActive = signal(true);
    classFormSchoolScope = signal<'all' | 'specific'>('all');
    classFormSchoolIds = signal<string[]>([]);
    classFormError = signal('');
    classFormSubmitting = signal(false);
    sectionSearch = signal('');
    sectionFormOpen = signal(false);
    sectionFormMode = signal<'add' | 'edit' | 'view'>('add');
    sectionFormId = signal<string | null>(null);
    sectionFormClassId = signal<string | null>(null);
    sectionFormName = signal('');
    sectionFormCode = signal('');
    sectionFormCapacity = signal<string>('');
    sectionFormTeacherId = signal<string | null>(null);
    sectionFormActive = signal(true);
    sectionFormError = signal('');
    classDeleteOpen = signal(false);
    classDeleteTarget = signal<ClassRow | null>(null);
    classDeleteError = signal('');
    classDeleteSubmitting = signal(false);
    sectionDeleteOpen = signal(false);
    sectionDeleteTarget = signal<SectionRow | null>(null);
    sectionDeleteError = signal('');
    sectionDeleteSubmitting = signal(false);
    sectionGeneratorOpen = signal(false);
    sectionGeneratorPattern = signal<'letters' | 'numbers' | 'custom'>('letters');
    sectionGeneratorRange = signal('A-F');
    sectionGeneratorCapacity = signal('');
    sectionGeneratorCustom = signal('');
    sectionGeneratorError = signal('');
    classReorderOpen = signal(false);
    sectionReorderOpen = signal(false);
    classReorderDraft = signal<ClassRow[]>([]);
    sectionReorderDraft = signal<SectionRow[]>([]);
    classImportOpen = signal(false);
    classImportType = signal<'classes' | 'sections'>('classes');
    classImportFileName = signal('');
    classImportRows = signal<Array<Record<string, string>>>([]);
    classImportErrors = signal<string[]>([]);
    classImportSubmitting = signal(false);

    gradingModel = signal<'letter' | 'numeric' | 'gpa' | 'custom'>('letter');
    gradingScale = computed(() => this.buildGradingScale(this.gradingModel()));
    gradingScales = signal<GradingScale[]>([]);
    gradingSchoolFilter = signal<string>('all');
    gradingSelectedScaleId = signal<string | null>(null);
    gradingActiveTab = signal<'bands' | 'settings'>('bands');
    gradingHeaderMenuOpen = signal(false);
    gradingScaleMenuOpen = signal(false);
    gradingBandMenuOpenId = signal<string | null>(null);
    gradingScaleFormOpen = signal(false);
    gradingScaleFormMode = signal<'add' | 'edit'>('add');
    gradingScaleFormId = signal<string | null>(null);
    gradingScaleFormName = signal('');
    gradingScaleFormTemplate = signal<string>('');
    gradingScaleFormType = signal<GradingScaleType>('Letter');
    gradingScaleFormSchoolScope = signal<'all' | 'specific'>('all');
    gradingScaleFormSchoolIds = signal<string[]>([]);
    gradingScaleFormPassMark = signal('');
    gradingScaleFormError = signal('');
    gradingBandFormOpen = signal(false);
    gradingBandFormMode = signal<'add' | 'edit'>('add');
    gradingBandFormId = signal<string | null>(null);
    gradingBandFormLabel = signal('');
    gradingBandFormMin = signal('');
    gradingBandFormMax = signal('');
    gradingBandFormPass = signal(true);
    gradingBandFormGpa = signal('');
    gradingBandFormError = signal('');

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

    isEditUserModalOpen = signal(false);
    editUserIndex = signal<number | null>(null);
    editName = signal('');
    editEmail = signal('');
    editRole = signal<UserRole>('Staff');
    editSchoolAccess = signal<'all' | 'selected'>('all');
    editSelectedSchools = signal<string[]>([]);
    editJobTitle = signal('');
    editDepartment = signal('');
    editStaffId = signal('');
    editTouched = signal(false);

    isCreateUserModalOpen = signal(false);
    createName = signal('');
    createEmail = signal('');
    createRole = signal<UserRole>('Staff');
    createRoleIds = signal<string[]>([]);
    createSchoolAccess = signal<'all' | 'selected'>('all');
    createSelectedSchools = signal<string[]>([]);
    createJobTitle = signal('');
    createDepartment = signal('');
    createStaffId = signal('');
    createTouched = signal(false);

    isViewUserModalOpen = signal(false);
    viewUser = signal<UserRow | null>(null);

    private userCounter = 0;
    private orgUnitCounter = 0;
    private classCounter = 0;
    private sectionCounter = 0;

    readonly orgUnitTypes: OrgUnitType[] = [
        'District',
        'School',
        'Division',
        'Department',
        'Grade',
        'Section',
        'Custom'
    ];

    readonly orgUnitTree = computed(() => this.buildOrgUnitTree(this.orgUnits()));
    readonly selectedOrgUnit = computed(() => {
        const activeId = this.activeOrgUnitId();
        return activeId ? this.orgUnits().find(unit => unit.id === activeId) || null : null;
    });
    readonly selectedOrgUnitPath = computed(() => this.buildOrgUnitPath(this.activeOrgUnitId()));
    readonly selectedOrgUnitMembers = computed(() => {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return [];
        const memberIds = new Set(this.orgUnitMemberIds()[activeId] || []);
        const search = this.orgUnitMemberSearch().trim().toLowerCase();
        return this.users().filter(user => {
            if (!memberIds.has(user.id)) return false;
            if (!search) return true;
            return (
                user.name.toLowerCase().includes(search) ||
                user.email.toLowerCase().includes(search) ||
                user.role.toLowerCase().includes(search)
            );
        });
    });
    readonly selectedOrgUnitMemberCount = computed(() => {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return 0;
        return (this.orgUnitMemberIds()[activeId] || []).length;
    });
    readonly selectedOrgUnitRoles = computed(() => {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return [];
        const roles = this.orgUnitRoles()[activeId] || [];
        const search = this.orgUnitRoleSearch().trim().toLowerCase();
        if (!search) return roles;
        return roles.filter(role => {
            const haystack = [role.name, role.description].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(search);
        });
    });
    readonly selectedOrgUnitRoleCount = computed(() => {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return 0;
        return (this.orgUnitRoles()[activeId] || []).length;
    });
    readonly hasMultipleSchools = computed(() => this.activeSchoolNames().length > 1);
    readonly sortedClassRows = computed(() => [...this.classRows()].sort((a, b) => a.sortOrder - b.sortOrder));
    readonly filteredClassRows = computed(() => {
        const query = this.classSearch().trim().toLowerCase();
        const schoolFilter = this.classSchoolFilter();
        const rows = this.classRows().filter(row => {
            if (schoolFilter !== 'all') {
                if (row.schoolIds !== null && !row.schoolIds.includes(schoolFilter)) {
                    return false;
                }
            }
            if (!query) return true;
            return row.name.toLowerCase().includes(query)
                || (row.code || '').toLowerCase().includes(query);
        });
        const sort = this.classSort();
        return [...rows].sort((a, b) => {
            if (sort === 'recent') {
                return (b.sortOrder ?? 0) - (a.sortOrder ?? 0);
            }
            return a.name.localeCompare(b.name);
        });
    });
    readonly selectedClass = computed(() => {
        const id = this.selectedClassId();
        return id ? this.classRows().find(row => row.id === id) || null : null;
    });
    readonly classSectionCountMap = computed(() => {
        const counts = new Map<string, number>();
        this.sectionRows().forEach(section => {
            counts.set(section.classId, (counts.get(section.classId) || 0) + 1);
        });
        return counts;
    });
    readonly skeletonRows = Array.from({ length: 5 });
    readonly filteredSections = computed(() => {
        const selected = this.selectedClassId();
        if (!selected) return [];
        const query = this.sectionSearch().trim().toLowerCase();
        return this.sectionRows()
            .filter(section => section.classId === selected)
            .filter(section => {
                if (!query) return true;
                return section.name.toLowerCase().includes(query)
                    || (section.code || '').toLowerCase().includes(query);
            })
            .sort((a, b) => a.sortOrder - b.sortOrder);
    });
    readonly sectionCountForSelectedClass = computed(() => {
        const selected = this.selectedClassId();
        if (!selected) return 0;
        return this.sectionRows().filter(section => section.classId === selected).length;
    });
    readonly totalSectionCount = computed(() => this.sectionRows().length);
    readonly teacherOptions = computed(() => this.users()
        .filter(user => ['Teacher', 'Staff'].includes(user.role))
        .map(user => ({
            id: user.id,
            label: user.name || user.email,
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
    );
    readonly classSelectorOptions = computed(() => this.sortedClassRows()
        .map(row => ({
            id: row.id,
            name: row.name,
            code: row.code,
            levelType: row.levelType || undefined,
        })));
    readonly staffSelectorOptions = computed(() => this.users()
        .filter(user => ['Teacher', 'Staff'].includes(user.role))
        .map(user => ({
            id: user.id,
            name: user.name || user.email,
            email: user.email,
            role: user.role,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)));
    readonly gradingScaleList = computed(() => {
        const filter = this.gradingSchoolFilter();
        const scales = this.gradingScales();
        if (filter === 'all') return scales;
        return scales.filter(scale => scale.schoolIds?.includes(filter));
    });
    readonly selectedGradingScale = computed(() => {
        const id = this.gradingSelectedScaleId();
        return id ? this.gradingScales().find(scale => scale.id === id) || null : null;
    });
    readonly gradingScaleUsageLabel = computed(() => {
        const scale = this.selectedGradingScale();
        if (!scale) return 'All schools';
        if (!scale.schoolIds || !scale.schoolIds.length) return 'All schools';
        return `${scale.schoolIds.length} school${scale.schoolIds.length === 1 ? '' : 's'}`;
    });
    readonly gradingTemplateOptions = computed(() => this.gradingScaleTemplates());
    readonly selectedGradingBands = computed(() => {
        const scale = this.selectedGradingScale();
        if (!scale) return [];
        return [...scale.bands].sort((a, b) => b.max - a.max);
    });
    readonly orgUnitDeleteRequiresConfirm = computed(() => {
        const impact = this.orgUnitDeleteImpact();
        return !!impact && impact.childUnits > 0;
    });

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

    readonly schoolTableColumns: MbTableColumn<SchoolRow>[] = [
        {
            key: 'name',
            label: 'School name',
            cell: row => row.name
        },
        {
            key: 'code',
            label: 'Code',
            cell: row => row.code
        },
        {
            key: 'location',
            label: 'Location',
            cell: row => this.formatSchoolLocation(row)
        },
        {
            key: 'timezone',
            label: 'Time zone',
            cell: row => row.timezone
        },
        {
            key: 'status',
            label: 'Status',
            cell: row => row.status
        }
    ];

    readonly orgUnitMemberColumns: MbTableColumn<UserRow>[] = [
        {
            key: 'name',
            label: 'Name',
            cell: row => row.name || '—'
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
            key: 'status',
            label: 'Status',
            cell: row => row.status
        }
    ];

    readonly stepLabels = [
        'Schools',
        'Staff & users',
        'Organizational units',
        'Academic structure',
        'Classes & sections',
        'Grading system',
        'Review & activate'
    ];

    readonly progressIndex = computed(() => {
        if (this.step() <= 0) return -1;
        return Math.min(this.step() - 1, this.stepLabels.length - 1);
    });

    readonly progressPercent = computed(() => {
        if (this.progressIndex() < 0) return 0;
        return ((this.progressIndex() + 1) / this.stepLabels.length) * 100;
    });

    readonly isReviewStep = computed(() => this.step() === 7);
    readonly isDoneStep = computed(() => this.step() === 8);
    readonly showErrors = computed(() => this.attemptedContinue());
    readonly userCount = computed(() => this.users().length);

    readonly levelsError = computed(() => {
        if (!this.showErrors() || this.step() !== 4) return '';
        return this.levels().some(level => level.trim()) ? '' : 'Add at least one level.';
    });

    readonly filteredUsers = computed(() => {
        const query = this.userSearch().trim().toLowerCase();
        if (!query) return this.users();
        return this.users().filter(user =>
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        );
    });

    readonly activeSchoolNames = computed(() => this.schoolRows()
        .filter(row => row.status === 'Active')
        .map(row => row.name)
    );

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

    readonly canContinueUsersStep = computed(() => this.users().length > 0 || this.usersStepSkipped());

    readonly reviewReady = computed(() =>
        this.schoolsValid()
        && this.canContinueUsersStep()
        && this.levels().length > 0
        && this.classRows().length > 0
        && this.sectionRows().length > 0
    );

    readonly reviewCompletedCount = computed(() => {
        let completed = 0;
        if (this.schoolsValid()) completed += 1;
        if (this.canContinueUsersStep()) completed += 1;
        completed += 1; // Organizational units step is optional.
        if (this.levels().length > 0) completed += 1;
        if (this.classRows().length > 0 && this.sectionRows().length > 0) completed += 1;
        completed += 1; // Grading system step is optional.
        completed += 1; // Review & activate.
        return completed;
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

    readonly schoolsValid = computed(() => {
        const rows = this.schoolRows().filter(row => row.status === 'Active');
        if (!rows.length) return false;
        return rows.every(row => !!row.name.trim() && !!row.code.trim() && !!row.country.trim() && !!row.timezone.trim());
    });

    readonly canSaveSchool = computed(() => {
        const code = this.schoolFormCode().trim();
        return !!this.schoolFormName().trim()
            && !!code
            && /^[a-z0-9-]+$/.test(code)
            && !!this.schoolFormCountry().trim()
            && this.isValidCountry(this.schoolFormCountry())
            && !!this.schoolFormTimezone().trim()
            && this.isValidTimezone(this.schoolFormTimezone());
    });

    readonly canContinue = computed(() => {
        switch (this.step()) {
            case 1:
                return this.schoolsValid();
            case 2:
                return this.canContinueUsersStep();
            case 4:
                return this.levels().length > 0;
            case 5:
                return this.classRows().length > 0 && this.sectionRows().length > 0;
            default:
                return true;
        }
    });

    readonly timezones = computed(() => TIMEZONE_OPTIONS.map(option => option.value));

    readonly countryOptions = computed(() => COUNTRY_OPTIONS);


    ngOnInit(): void {
        this.loadInitialState();
        this.initAutosave();
    }

    startSetup(): void {
        this.step.set(1);
        this.attemptedContinue.set(false);
        this.persistState('in_progress');
    }

    skipSetup(): void {
        this.persistState('skipped');
        this.router.navigateByUrl('/dashboard');
    }

    back(): void {
        if (this.step() <= 0) return;
        this.step.set(this.step() - 1);
        this.attemptedContinue.set(false);
        this.persistState('in_progress');
    }

    next(): void {
        if (!this.canContinue()) {
            this.attemptedContinue.set(true);
            return;
        }
        if (this.step() < 7) {
            this.step.set(this.step() + 1);
            this.attemptedContinue.set(false);
            this.persistState('in_progress');
            return;
        }
        this.completeSetup();
    }

    goToStep(index: number): void {
        const target = Math.min(Math.max(index, 1), 7);
        this.step.set(target);
        this.attemptedContinue.set(false);
        this.persistState('in_progress');
    }

    continueFromPanel(): void {
        const current = Math.max(this.step(), 1);
        const target = Math.min(current, 7);
        this.step.set(target);
        this.attemptedContinue.set(false);
        this.scrollToCurrent();
    }

    private scrollToCurrent(): void {
        try {
            const el = document.getElementById('setup-step-content');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } catch {
            // No-op
        }
    }

    addSchoolRow(): void {
        const name = '';
        this.schoolRows.update(rows => [...rows, this.defaultSchoolRow(name)]);
    }

    removeSchoolRow(index: number): void {
        this.schoolRows.update(rows => rows.filter((_, i) => i !== index));
    }

    updateSchoolRow(index: number, field: keyof SchoolRow, value: string): void {
        this.schoolRows.update(rows => rows.map((row, i) => i === index ? { ...row, [field]: value } : row));
    }

    updateSchoolAddressField(index: number, field: keyof AddressValue, value: string): void {
        this.schoolRows.update(rows => rows.map((row, i) => {
            if (i !== index) return row;
            return {
                ...row,
                address: { ...(row.address || {}), [field]: value }
            };
        }));
    }

    updateSchoolAddress(index: number, value: AddressValue): void {
        this.schoolRows.update(rows => rows.map((row, i) => i === index ? { ...row, address: value } : row));
    }

    openAddSchool(): void {
        this.editingSchoolIndex.set(null);
        this.schoolFormName.set('');
        this.schoolFormCode.set('');
        this.schoolFormCountry.set(this.country());
        this.schoolFormTimezone.set(this.defaultTimezone());
        this.schoolFormAddress.set({});
        this.schoolFormTouched.set(false);
        this.schoolFormCodeTouched.set(false);
        this.isSchoolModalOpen.set(true);
    }

    openEditSchool(index: number): void {
        const row = this.schoolRows()[index];
        if (!row) return;
        this.editingSchoolIndex.set(index);
        this.schoolFormName.set(row.name);
        this.schoolFormCode.set(row.code);
        this.schoolFormCountry.set(row.country);
        this.schoolFormTimezone.set(row.timezone);
        this.schoolFormAddress.set(row.address || {});
        this.schoolFormTouched.set(false);
        this.schoolFormCodeTouched.set(true);
        this.isSchoolModalOpen.set(true);
    }

    closeSchoolModal(): void {
        this.isSchoolModalOpen.set(false);
        this.editingSchoolIndex.set(null);
        this.schoolFormTouched.set(false);
        this.schoolFormCodeTouched.set(false);
    }

    saveSchool(): void {
        if (!this.canSaveSchool()) {
            this.schoolFormTouched.set(true);
            return;
        }
        const nextRow: SchoolRow = {
            name: this.schoolFormName().trim(),
            code: this.schoolFormCode().trim(),
            country: this.schoolFormCountry().trim(),
            timezone: this.schoolFormTimezone().trim(),
            status: 'Active',
            address: this.schoolFormAddress(),
        };
        const editIndex = this.editingSchoolIndex();
        if (editIndex === null) {
            this.schoolRows.update(rows => [...rows, nextRow]);
        } else {
            this.schoolRows.update(rows => rows.map((row, i) => i === editIndex ? { ...row, ...nextRow } : row));
        }
        this.isSchoolModalOpen.set(false);
        this.editingSchoolIndex.set(null);
        this.schoolFormTouched.set(false);
        this.schoolFormCodeTouched.set(false);
    }

    toggleSchoolStatus(index: number): void {
        this.schoolRows.update(rows => rows.map((row, i) => {
            if (i !== index) return row;
            const status = row.status === 'Active' ? 'Inactive' : 'Active';
            return { ...row, status };
        }));
    }

    deleteSchool(index: number): void {
        this.schoolRows.update(rows => rows.filter((_, i) => i !== index));
    }

    formatSchoolLocation(row: SchoolRow): string {
        if (row.address?.city) {
            return `${row.address.city}, ${row.country || '—'}`;
        }
        return row.country || '—';
    }

    getSchoolRowIndex(row: SchoolRow): number {
        return this.schoolRows().indexOf(row);
    }

    handleSchoolCellClick(event: { row: SchoolRow; column: MbTableColumn<SchoolRow> }): void {
        if (String(event.column.key) !== 'name') return;
        const index = this.getSchoolRowIndex(event.row);
        if (index < 0) return;
        this.openEditSchool(index);
    }

    toggleSchoolMenu(index: number, event?: MouseEvent): void {
        event?.stopPropagation();
        const next = this.schoolMenuOpenIndex() === index ? null : index;
        this.closeAllActionMenus();
        this.schoolMenuOpenIndex.set(next);
    }

    closeSchoolMenu(): void {
        this.schoolMenuOpenIndex.set(null);
    }

    getUserRowIndex(row: UserRow): number {
        return this.users().indexOf(row);
    }

    handleUserCellClick(event: { row: UserRow; column: MbTableColumn<UserRow> }): void {
        if (String(event.column.key) !== 'name') return;
        const index = this.getUserRowIndex(event.row);
        if (index < 0) return;
        this.openViewUser(index);
    }

    toggleUserMenu(id: string, event?: MouseEvent): void {
        event?.stopPropagation();
        const next = this.userMenuOpenId() === id ? null : id;
        this.closeAllActionMenus();
        this.userMenuOpenId.set(next);
    }

    userMenuKey(row: UserRow): string {
        return row.id;
    }

    closeUserMenu(): void {
        this.userMenuOpenId.set(null);
    }

    trackOrgUnit = (_: number, node: OrgUnitNode) => node.id;
    trackUserRow = (_: number, user: UserRow) => user.id;
    trackOrgUnitRole = (_: number, role: OrgUnitRole) => role.id;
    orgUnitMemberRowKey = (row: UserRow) => row.id;

    onSchoolFormNameChange(value: string): void {
        this.schoolFormName.set(value);
        if (this.editingSchoolIndex() !== null) return;
        if (this.schoolFormCodeTouched()) return;
        this.schoolFormCode.set(this.generateSchoolCode(value));
    }

    onSchoolFormCodeChange(value: string): void {
        this.schoolFormCodeTouched.set(true);
        const normalized = value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        this.schoolFormCode.set(normalized);
    }

    copySchoolAddressFromTenant(): void {
        const tenantAddress = this.tenantAddress();
        if (!tenantAddress) return;
        this.schoolFormAddress.set({ ...tenantAddress });
        if (!this.schoolFormCountry().trim() && this.country().trim()) {
            this.schoolFormCountry.set(this.country());
        }
    }

    markSchoolFormTouched(): void {
        this.schoolFormTouched.set(true);
    }

    onSchoolFormCountryChange(value: string): void {
        this.schoolFormCountry.set(value);
        if (!this.schoolFormTimezone().trim()) {
            this.schoolFormTimezone.set(this.defaultTimezone());
        }
    }

    startAddRootUnit(): void {
        this.orgUnitFormParentId.set(null);
        this.openOrgUnitForm();
    }

    startAddChildUnit(): void {
        const activeId = this.activeOrgUnitId();
        if (!activeId) {
            this.orgUnitFormParentId.set(null);
            this.openOrgUnitForm();
            this.orgUnitFormError.set('Select a parent unit before creating a child.');
            return;
        }
        this.orgUnitFormParentId.set(activeId);
        this.openOrgUnitForm();
    }

    openOrgUnitForm(): void {
        this.orgUnitFormName.set('');
        this.orgUnitFormType.set('Department');
        this.orgUnitFormStatus.set('Active');
        this.orgUnitFormError.set('');
        this.orgUnitFormOpen.set(true);
    }

    cancelOrgUnitForm(): void {
        this.orgUnitFormOpen.set(false);
        this.orgUnitFormError.set('');
        this.orgUnitFormParentId.set(null);
    }

    requestCloseOrgUnitForm(): void {
        if (!this.orgUnitFormOpen()) return;
        if (this.isOrgUnitFormDirty() && !window.confirm('Discard this organizational unit?')) {
            return;
        }
        this.cancelOrgUnitForm();
    }

    setOrgUnitFormType(value: string): void {
        if (this.orgUnitTypes.includes(value as OrgUnitType)) {
            this.orgUnitFormType.set(value as OrgUnitType);
        }
    }

    saveOrgUnitForm(): void {
        const name = this.orgUnitFormName().trim();
        if (!name) {
            this.orgUnitFormError.set('Unit name is required.');
            return;
        }

        const newUnit: OrgUnit = {
            id: this.nextOrgUnitId(),
            name,
            type: this.orgUnitFormType(),
            status: this.orgUnitFormStatus(),
            parentId: this.orgUnitFormParentId() || undefined
        };

        this.orgUnits.update(items => [...items, newUnit]);
        if (newUnit.parentId) {
            this.expandedOrgUnitIds.update(items => items.includes(newUnit.parentId!)
                ? items
                : [...items, newUnit.parentId!]);
        }
        this.activeOrgUnitId.set(newUnit.id);
        this.cancelOrgUnitForm();
    }

    openDeleteOrgUnit(): void {
        const target = this.selectedOrgUnit();
        if (!target) return;
        this.orgUnitDeleteTarget.set(target);
        this.orgUnitDeleteConfirm.set('');
        this.orgUnitDeleteError.set('');
        this.orgUnitDeleteImpact.set(null);
        this.orgUnitDeleteImpactLoading.set(true);
        this.orgUnitDeleteSubmitting.set(false);
        this.isOrgUnitDeleteOpen.set(true);
        const impact = this.buildOrgUnitDeleteImpact(target.id);
        setTimeout(() => {
            this.orgUnitDeleteImpact.set(impact);
            this.orgUnitDeleteImpactLoading.set(false);
        }, 120);
    }

    toggleOuActionsMenu(event?: MouseEvent): void {
        event?.stopPropagation();
        const next = !this.ouActionsMenuOpen();
        this.closeAllActionMenus();
        this.ouActionsMenuOpen.set(next);
    }

    closeOuActionsMenu(): void {
        this.ouActionsMenuOpen.set(false);
    }

    requestCloseDeleteOrgUnit(): void {
        if (this.orgUnitDeleteSubmitting()) return;
        this.isOrgUnitDeleteOpen.set(false);
        this.orgUnitDeleteTarget.set(null);
        this.orgUnitDeleteImpact.set(null);
        this.orgUnitDeleteImpactLoading.set(false);
        this.orgUnitDeleteConfirm.set('');
        this.orgUnitDeleteError.set('');
    }

    openRenameOrgUnit(): void {
        const target = this.selectedOrgUnit();
        if (!target) return;
        this.orgUnitRenameName.set(target.name);
        this.orgUnitRenameError.set('');
        this.orgUnitRenameSubmitting.set(false);
        this.isOrgUnitRenameOpen.set(true);
    }

    requestCloseRenameOrgUnit(): void {
        if (this.orgUnitRenameSubmitting()) return;
        this.isOrgUnitRenameOpen.set(false);
        this.orgUnitRenameError.set('');
    }

    saveRenameOrgUnit(): void {
        const target = this.selectedOrgUnit();
        if (!target || this.orgUnitRenameSubmitting()) return;
        const nextName = this.orgUnitRenameName().trim();
        if (!nextName) {
            this.orgUnitRenameError.set('Unit name is required.');
            return;
        }
        if (nextName === target.name) {
            this.requestCloseRenameOrgUnit();
            return;
        }
        this.orgUnitRenameSubmitting.set(true);
        this.orgUnits.update(items => items.map(unit => unit.id === target.id ? { ...unit, name: nextName } : unit));
        this.toast.success(`Organizational unit renamed to "${nextName}".`);
        this.requestCloseRenameOrgUnit();
    }

    openMoveOrgUnit(): void {
        const target = this.selectedOrgUnit();
        if (!target) return;
        this.orgUnitMoveTarget.set(target);
        this.orgUnitMoveParentId.set(target.parentId ?? null);
        this.orgUnitMoveError.set('');
        this.orgUnitMoveSubmitting.set(false);
        this.isOrgUnitMoveOpen.set(true);
    }

    requestCloseMoveOrgUnit(): void {
        if (this.orgUnitMoveSubmitting()) return;
        this.isOrgUnitMoveOpen.set(false);
        this.orgUnitMoveTarget.set(null);
        this.orgUnitMoveParentId.set(null);
        this.orgUnitMoveError.set('');
    }

    openChangeParentOrgUnit(): void {
        const target = this.selectedOrgUnit();
        if (!target) return;
        this.orgUnitMoveTarget.set(target);
        this.orgUnitMoveParentId.set(target.parentId ?? null);
        this.orgUnitMoveError.set('');
        this.orgUnitMoveSubmitting.set(false);
        this.isOrgUnitChangeParentOpen.set(true);
    }

    requestCloseChangeParentOrgUnit(): void {
        if (this.orgUnitMoveSubmitting()) return;
        this.isOrgUnitChangeParentOpen.set(false);
        this.orgUnitMoveTarget.set(null);
        this.orgUnitMoveParentId.set(null);
        this.orgUnitMoveError.set('');
    }

    setOrgUnitMoveParent(value: string): void {
        this.orgUnitMoveParentId.set(value ? value : null);
    }

    saveMoveOrgUnit(): void {
        this.commitOrgUnitParentChange('moved');
    }

    saveChangeParentOrgUnit(): void {
        this.commitOrgUnitParentChange('updated');
    }

    orgUnitParentOptions(): Array<{ id: string | null; label: string }> {
        const target = this.orgUnitMoveTarget();
        if (!target) return [{ id: null, label: 'Organization (root)' }];
        const excluded = new Set(this.collectOrgUnitDescendantIds(target.id));
        excluded.add(target.id);
        const options = this.orgUnits()
            .filter(unit => !excluded.has(unit.id))
            .map(unit => ({
                id: unit.id,
                label: this.buildOrgUnitPath(unit.id)
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
        return [{ id: null, label: 'Organization (root)' }, ...options];
    }

    private commitOrgUnitParentChange(action: 'moved' | 'updated'): void {
        const target = this.orgUnitMoveTarget();
        if (!target || this.orgUnitMoveSubmitting()) return;
        const nextParentId = this.orgUnitMoveParentId();
        if (!this.isOrgUnitParentAllowed(target.id, nextParentId)) {
            this.orgUnitMoveError.set('Select a valid parent unit.');
            return;
        }
        if ((nextParentId ?? null) === (target.parentId ?? null)) {
            this.closeOrgUnitMoveModal();
            return;
        }
        this.orgUnitMoveSubmitting.set(true);
        this.orgUnits.update(items => items.map(unit => unit.id === target.id
            ? { ...unit, parentId: nextParentId ?? undefined }
            : unit));
        if (nextParentId) {
            this.expandedOrgUnitIds.update(items => items.includes(nextParentId)
                ? items
                : [...items, nextParentId]);
        }
        this.toast.success(`Organizational unit "${target.name}" ${action}.`);
        this.closeOrgUnitMoveModal();
    }

    private closeOrgUnitMoveModal(): void {
        this.orgUnitMoveSubmitting.set(false);
        if (this.isOrgUnitMoveOpen()) {
            this.requestCloseMoveOrgUnit();
            return;
        }
        this.requestCloseChangeParentOrgUnit();
    }

    private isOrgUnitParentAllowed(targetId: string, parentId: string | null): boolean {
        if (!parentId) return true;
        if (parentId === targetId) return false;
        const descendants = new Set(this.collectOrgUnitDescendantIds(targetId));
        return !descendants.has(parentId);
    }

    canDeactivateSelectedOrgUnit(): boolean {
        const target = this.selectedOrgUnit();
        return !!target && target.status === 'Active';
    }

    openDeactivateOrgUnit(): void {
        const target = this.selectedOrgUnit();
        if (!target || target.status !== 'Active') return;
        this.orgUnitDeactivateError.set('');
        this.orgUnitDeactivateSubmitting.set(false);
        this.isOrgUnitDeactivateOpen.set(true);
    }

    requestCloseDeactivateOrgUnit(): void {
        if (this.orgUnitDeactivateSubmitting()) return;
        this.isOrgUnitDeactivateOpen.set(false);
        this.orgUnitDeactivateError.set('');
    }

    deactivateSelectedOrgUnit(): void {
        const target = this.selectedOrgUnit();
        if (!target || target.status !== 'Active' || this.orgUnitDeactivateSubmitting()) return;
        this.orgUnitDeactivateSubmitting.set(true);
        this.orgUnits.update(items => items.map(unit => unit.id === target.id
            ? { ...unit, status: 'Inactive' }
            : unit));
        this.toast.success(`Organizational unit "${target.name}" deactivated.`);
        this.requestCloseDeactivateOrgUnit();
    }

    canDeleteSelectedOrgUnit(): boolean {
        return !!this.selectedOrgUnit() && this.canDeleteOrgUnit() && !this.isOrgUnitDeleteLocked();
    }

    deleteSelectedOrgUnit(): void {
        const target = this.orgUnitDeleteTarget();
        if (!target || this.orgUnitDeleteSubmitting()) return;
        if (this.orgUnitDeleteRequiresConfirm() && !this.isOrgUnitDeleteConfirmValid()) return;
        this.orgUnitDeleteSubmitting.set(true);
        const deleteIds = this.collectOrgUnitDescendantIds(target.id);
        deleteIds.unshift(target.id);
        this.orgUnits.update(items => items.filter(unit => !deleteIds.includes(unit.id)));
        this.orgUnitMemberIds.update(map => {
            const next = { ...map };
            deleteIds.forEach(id => delete next[id]);
            return next;
        });
        this.orgUnitRoles.update(map => {
            const next = { ...map };
            deleteIds.forEach(id => delete next[id]);
            return next;
        });
        this.expandedOrgUnitIds.update(items => items.filter(id => !deleteIds.includes(id)));
        this.selectFallbackOrgUnit(target);
        // TODO: log audit event for organizational unit deletion.
        this.toast.success(`Organizational unit "${target.name}" and its child units were deleted.`);
        this.requestCloseDeleteOrgUnit();
    }

    isOrgUnitDeleteConfirmValid(): boolean {
        const target = this.orgUnitDeleteTarget();
        if (!target) return false;
        return this.orgUnitDeleteConfirm().trim().toLowerCase() === target.name.trim().toLowerCase();
    }

    getOrgUnitDeleteDisabledReason(): string | null {
        if (!this.selectedOrgUnit()) return 'Select a unit to manage actions.';
        if (this.isOrgUnitDeleteLocked()) return 'This unit can’t be deleted.';
        if (!this.canDeleteOrgUnit()) return 'Insufficient permissions.';
        return null;
    }

    private isOrgUnitDeleteLocked(): boolean {
        return false;
    }

    private canDeleteOrgUnit(): boolean {
        return true;
    }

    private buildOrgUnitDeleteImpact(id: string): OrgUnitDeleteImpact {
        const descendantIds = this.collectOrgUnitDescendantIds(id);
        const affectedIds = [id, ...descendantIds];
        const memberIds = new Set<string>();
        const memberMap = this.orgUnitMemberIds();
        affectedIds.forEach(unitId => {
            (memberMap[unitId] || []).forEach(memberId => memberIds.add(memberId));
        });
        const roleMap = this.orgUnitRoles();
        const rolesCount = affectedIds.reduce((count, unitId) => count + (roleMap[unitId]?.length || 0), 0);
        return {
            childUnits: descendantIds.length,
            members: memberIds.size,
            roles: rolesCount
        };
    }

    private collectOrgUnitDescendantIds(id: string): string[] {
        const byParent = new Map<string, string[]>();
        this.orgUnits().forEach(unit => {
            if (!unit.parentId) return;
            const list = byParent.get(unit.parentId) ?? [];
            list.push(unit.id);
            byParent.set(unit.parentId, list);
        });
        const collected: string[] = [];
        const stack = [...(byParent.get(id) ?? [])];
        while (stack.length) {
            const next = stack.pop()!;
            collected.push(next);
            const children = byParent.get(next);
            if (children?.length) {
                stack.push(...children);
            }
        }
        return collected;
    }

    private selectFallbackOrgUnit(deletedUnit: OrgUnit): void {
        const remaining = this.orgUnits();
        if (!remaining.length) {
            this.activeOrgUnitId.set(null);
            return;
        }
        const parentId = deletedUnit.parentId ?? null;
        if (parentId && remaining.some(unit => unit.id === parentId)) {
            this.selectOrgUnit(parentId);
            return;
        }
        const root = remaining.find(unit => !unit.parentId);
        if (root) {
            this.selectOrgUnit(root.id);
            return;
        }
        this.activeOrgUnitId.set(remaining[0].id);
    }

    isOrgUnitFormDirty(): boolean {
        return (
            this.orgUnitFormName().trim().length > 0 ||
            this.orgUnitFormType() !== 'Department' ||
            this.orgUnitFormStatus() !== 'Active'
        );
    }


    selectOrgUnit(id: string): void {
        this.activeOrgUnitId.set(id);
        this.orgUnitMemberSearch.set('');
        this.assignMembersOpen.set(false);
        this.assignMemberIds.set([]);
    }

    toggleOrgUnitExpanded(id: string): void {
        this.expandedOrgUnitIds.update(items => items.includes(id)
            ? items.filter(item => item !== id)
            : [...items, id]);
    }

    isOrgUnitExpanded(id: string): boolean {
        return this.expandedOrgUnitIds().includes(id);
    }

    setOrgUnitTab(tab: 'members' | 'roles'): void {
        this.activeOrgUnitTab.set(tab);
        if (tab === 'roles') {
            this.assignMembersOpen.set(false);
        }
    }

    openAssignMembers(): void {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return;
        this.assignMemberIds.set([...(this.orgUnitMemberIds()[activeId] || [])]);
        this.assignMembersOpen.set(true);
    }

    cancelAssignMembers(): void {
        this.assignMembersOpen.set(false);
    }

    toggleAssignMember(userId: string, event: Event): void {
        const target = event.target as HTMLInputElement | null;
        const checked = target?.checked ?? false;
        this.assignMemberIds.update(ids => {
            if (checked) {
                return ids.includes(userId) ? ids : [...ids, userId];
            }
            return ids.filter(id => id !== userId);
        });
    }

    saveAssignMembers(): void {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return;
        const memberIds = this.assignMemberIds();
        this.orgUnitMemberIds.update(map => ({
            ...map,
            [activeId]: memberIds
        }));
        this.assignMembersOpen.set(false);
    }

    removeMemberFromOrgUnit(user: UserRow): void {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return;
        this.orgUnitMemberIds.update(map => ({
            ...map,
            [activeId]: (map[activeId] || []).filter(id => id !== user.id)
        }));
    }

    confirmRemoveMemberFromOrgUnit(user: UserRow): void {
        const label = user.name || user.email;
        if (!window.confirm(`Remove ${label} from this unit?`)) return;
        this.removeMemberFromOrgUnit(user);
    }

    teacherLabel(id: string | null | undefined): string {
        if (!id) return 'Unassigned';
        const user = this.users().find(item => item.id === id);
        return user?.name || user?.email || 'Unassigned';
    }

    trackClassRow(_: number, row: ClassRow): string {
        return row.id;
    }

    trackSectionRow(_: number, row: SectionRow): string {
        return row.id;
    }

    objectKeys(row: Record<string, string>): string[] {
        return Object.keys(row);
    }

    openAssignRoles(): void {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return;
        const currentRoles = this.orgUnitRoles()[activeId] || [];
        this.assignRoleIds.set(currentRoles.map(role => role.id));
        this.assignRoleDraft.set(currentRoles);
        this.assignRolesOpen.set(true);
    }

    cancelAssignRoles(): void {
        this.assignRolesOpen.set(false);
        this.assignRoleDraft.set([]);
    }

    handleAssignRoleChange(event: { ids: string[]; roles?: OrgUnitRole[] }): void {
        this.assignRoleIds.set(event.ids);
        if (event.roles && event.roles.length) {
            const normalized = event.roles.map(role => ({
                id: role.id,
                name: role.name,
                description: role.description
            }));
            this.assignRoleDraft.set(normalized);
            return;
        }
        const fallback = new Map(this.assignRoleDraft().map(role => [role.id, role]));
        const next = event.ids.map(id => fallback.get(id) ?? { id, name: id });
        this.assignRoleDraft.set(next);
    }

    saveAssignRoles(): void {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return;
        this.orgUnitRoles.update(map => ({
            ...map,
            [activeId]: this.assignRoleDraft()
        }));
        this.assignRolesOpen.set(false);
    }

    removeRoleFromOrgUnit(role: OrgUnitRole): void {
        const activeId = this.activeOrgUnitId();
        if (!activeId) return;
        this.orgUnitRoles.update(map => ({
            ...map,
            [activeId]: (map[activeId] || []).filter(item => item.id !== role.id)
        }));
    }

    setLevelsTemplate(template: 'k12' | 'primary_secondary' | 'custom'): void {
        this.levelsTemplate.set(template);
        this.levels.set(this.defaultLevels(template));
    }

    addLevel(): void {
        this.levels.update(items => [...items, '']);
    }

    updateLevel(index: number, value: string): void {
        this.levels.update(items => items.map((item, i) => i === index ? value : item));
    }

    removeLevel(index: number): void {
        this.levels.update(items => items.filter((_, i) => i !== index));
    }

    openAddClass(): void {
        this.classFormMode.set('add');
        this.classFormId.set(null);
        this.classFormName.set('');
        this.classFormCode.set('');
        this.classFormLevel.set('');
        this.classFormNotes.set('');
        this.classFormActive.set(true);
        this.classFormSchoolScope.set('all');
        this.classFormSchoolIds.set([]);
        this.classFormError.set('');
        this.classFormSubmitting.set(false);
        this.classFormOpen.set(true);
    }

    openEditClass(row: ClassRow): void {
        this.classFormMode.set('edit');
        this.classFormId.set(row.id);
        this.classFormName.set(row.name);
        this.classFormCode.set(row.code || '');
        this.classFormLevel.set(row.levelType || '');
        this.classFormNotes.set(row.notes || '');
        this.classFormActive.set(row.active);
        this.classFormSchoolScope.set(row.schoolIds === null ? 'all' : 'specific');
        this.classFormSchoolIds.set(row.schoolIds ? [...row.schoolIds] : []);
        this.classFormError.set('');
        this.classFormSubmitting.set(false);
        this.classFormOpen.set(true);
    }

    openViewClass(row: ClassRow): void {
        this.openEditClass(row);
        this.classFormMode.set('view');
    }

    toggleClassMenu(id: string, event?: MouseEvent): void {
        event?.stopPropagation();
        const next = this.classMenuOpenId() === id ? null : id;
        this.closeAllActionMenus();
        this.classMenuOpenId.set(next);
    }

    closeClassMenu(): void {
        this.classMenuOpenId.set(null);
    }

    toggleClassHeaderMenu(event?: MouseEvent): void {
        event?.stopPropagation();
        const next = !this.classHeaderMenuOpen();
        this.closeAllActionMenus();
        this.classHeaderMenuOpen.set(next);
    }

    closeClassHeaderMenu(): void {
        this.classHeaderMenuOpen.set(false);
    }

    toggleSectionsMenu(event?: MouseEvent): void {
        event?.stopPropagation();
        const next = !this.sectionsMenuOpen();
        this.closeAllActionMenus();
        this.sectionsMenuOpen.set(next);
    }

    closeSectionsMenu(): void {
        this.sectionsMenuOpen.set(false);
    }

    toggleSectionMenu(id: string, event?: MouseEvent): void {
        event?.stopPropagation();
        const next = this.sectionMenuOpenId() === id ? null : id;
        this.closeAllActionMenus();
        this.sectionMenuOpenId.set(next);
    }

    closeSectionMenu(): void {
        this.sectionMenuOpenId.set(null);
    }

    requestCloseClassForm(): void {
        if (this.classFormMode() === 'view') {
            this.classFormOpen.set(false);
            return;
        }
        if (this.isClassFormDirty() && !window.confirm('Discard changes?')) {
            return;
        }
        this.classFormOpen.set(false);
        this.classFormError.set('');
    }

    async saveClassForm(): Promise<void> {
        if (this.classFormSubmitting()) return;
        if (this.classFormMode() === 'view') {
            this.classFormOpen.set(false);
            return;
        }
        const name = this.classFormName().trim();
        if (!name) {
            this.classFormError.set('Class name is required.');
            return;
        }
        const code = this.classFormCode().trim();
        if (code && !/^[a-z0-9-]+$/i.test(code)) {
            this.classFormError.set('Class code must be alphanumeric and can include hyphens.');
            return;
        }
        const levelType = this.classFormLevel();
        const active = this.classFormActive();
        const schoolIds = this.hasMultipleSchools() && this.classFormSchoolScope() === 'specific'
            ? [...this.classFormSchoolIds()]
            : null;
        if (this.hasMultipleSchools() && this.classFormSchoolScope() === 'specific' && (!schoolIds || !schoolIds.length)) {
            this.classFormError.set('Select at least one school.');
            return;
        }
        const payload = {
            name,
            code: code || undefined,
            levelType: levelType || undefined,
            active,
            schoolIds: schoolIds && schoolIds.length ? schoolIds : undefined,
            notes: this.classFormNotes().trim() || undefined
        };

        try {
            this.classFormSubmitting.set(true);
            if (this.classFormMode() === 'edit' && this.classFormId()) {
                const id = this.classFormId()!;
                const saved = await firstValueFrom(this.classSectionService.updateClass(id, payload));
                const savedId = saved.id || saved._id || id;
                const resolvedSchoolIds = saved.schoolIds ?? payload.schoolIds ?? null;
                this.classRows.update(items => items.map(row => row.id === savedId
                    ? {
                        ...row,
                        ...payload,
                        id: savedId,
                        sortOrder: row.sortOrder,
                        schoolIds: resolvedSchoolIds,
                    }
                    : row));
                this.toast.success(`Class "${name}" updated.`);
            } else {
                const saved = await firstValueFrom(this.classSectionService.createClass(payload));
                const id = saved.id || saved._id || this.nextClassId();
                const sortOrder = saved.sortOrder ?? (this.classRows().length + 1);
                const newRow: ClassRow = {
                    id,
                    sortOrder,
                    name: saved.name || payload.name,
                    code: saved.code ?? payload.code,
                    levelType: this.normalizeClassLevel(saved.levelType ?? payload.levelType),
                    active: saved.active ?? payload.active ?? true,
                    schoolIds: saved.schoolIds ?? payload.schoolIds ?? null,
                    notes: saved.notes ?? payload.notes,
                };
                this.classRows.update(items => [...items, newRow]);
                this.selectedClassId.set(id);
                this.toast.success(`Class "${name}" added.`);
            }
            this.classFormOpen.set(false);
        } catch (error: any) {
            const rawMessage = error?.error?.message;
            const message = Array.isArray(rawMessage)
                ? rawMessage.join(' ')
                : (rawMessage || 'Unable to save class. Please try again.');
            this.classFormError.set(message);
        } finally {
            this.classFormSubmitting.set(false);
        }
    }

    toggleClassSchoolSelection(id: string, checked: boolean): void {
        this.classFormSchoolIds.update(items => {
            if (checked) return items.includes(id) ? items : [...items, id];
            return items.filter(item => item !== id);
        });
    }

    openClassDelete(row: ClassRow): void {
        this.classDeleteTarget.set(row);
        this.classDeleteError.set('');
        this.classDeleteSubmitting.set(false);
        this.classDeleteOpen.set(true);
    }

    requestCloseClassDelete(): void {
        if (this.classDeleteSubmitting()) return;
        this.classDeleteOpen.set(false);
        this.classDeleteTarget.set(null);
        this.classDeleteError.set('');
    }

    deleteClass(): void {
        const target = this.classDeleteTarget();
        if (!target || this.classDeleteSubmitting()) return;
        this.classDeleteSubmitting.set(true);
        this.sectionRows.update(items => items.filter(section => section.classId !== target.id));
        this.classRows.update(items => items.filter(row => row.id !== target.id));
        if (this.selectedClassId() === target.id) {
            const remaining = this.classRows();
            this.selectedClassId.set(remaining.length ? remaining[0].id : null);
        }
        this.toast.success(`Class "${target.name}" deleted.`);
        this.classDeleteSubmitting.set(false);
        this.requestCloseClassDelete();
    }

    duplicateClass(row: ClassRow): void {
        const id = this.nextClassId();
        const sortOrder = this.classRows().length + 1;
        const name = `${row.name} copy`;
        const newRow: ClassRow = {
            ...row,
            id,
            name,
            sortOrder
        };
        this.classRows.update(items => [...items, newRow]);
        this.toast.success(`Class "${row.name}" duplicated.`);
    }

    toggleClassActive(row: ClassRow): void {
        this.classRows.update(items => items.map(item => item.id === row.id
            ? { ...item, active: !item.active }
            : item));
        this.toast.success(`Class "${row.name}" ${row.active ? 'deactivated' : 'activated'}.`);
    }

    setClassSort(value: string): void {
        if (value === 'az' || value === 'recent') {
            this.classSort.set(value);
        }
    }

    openAddSection(selectedClass?: ClassRow | null): void {
        const target = selectedClass || this.selectedClass();
        if (!target) {
            this.toast.warning('Select a class first.');
            return;
        }
        this.sectionFormMode.set('add');
        this.sectionFormId.set(null);
        this.sectionFormClassId.set(target.id);
        this.sectionFormName.set('');
        this.sectionFormCode.set('');
        this.sectionFormCapacity.set('');
        this.sectionFormTeacherId.set(null);
        this.sectionFormActive.set(true);
        this.sectionFormError.set('');
        this.sectionFormOpen.set(true);
    }

    openEditSection(section: SectionRow): void {
        this.sectionFormMode.set('edit');
        this.sectionFormId.set(section.id);
        this.sectionFormClassId.set(section.classId);
        this.sectionFormName.set(section.name);
        this.sectionFormCode.set(section.code || '');
        this.sectionFormCapacity.set(section.capacity?.toString() || '');
        this.sectionFormTeacherId.set(section.homeroomTeacherId || null);
        this.sectionFormActive.set(section.active);
        this.sectionFormError.set('');
        this.sectionFormOpen.set(true);
    }

    openViewSection(section: SectionRow): void {
        this.openEditSection(section);
        this.sectionFormMode.set('view');
    }

    requestCloseSectionForm(): void {
        if (this.sectionFormMode() === 'view') {
            this.sectionFormOpen.set(false);
            return;
        }
        if (this.isSectionFormDirty() && !window.confirm('Discard changes?')) {
            return;
        }
        this.sectionFormOpen.set(false);
        this.sectionFormError.set('');
    }

    saveSectionForm(): void {
        if (this.sectionFormMode() === 'view') {
            this.sectionFormOpen.set(false);
            return;
        }
        const classId = this.sectionFormClassId();
        if (!classId) {
            this.sectionFormError.set('Select a class.');
            return;
        }
        const name = this.sectionFormName().trim();
        if (!name) {
            this.sectionFormError.set('Section name is required.');
            return;
        }
        const code = this.sectionFormCode().trim();
        const capacityValue = this.sectionFormCapacity().trim();
        const capacityNumber = capacityValue ? Number(capacityValue) : null;
        if (capacityValue && (capacityNumber === null || !Number.isFinite(capacityNumber) || capacityNumber < 0)) {
            this.sectionFormError.set('Capacity must be a valid number.');
            return;
        }
        const payload = {
            classId,
            name,
            code: code || undefined,
            capacity: capacityValue ? capacityNumber : null,
            homeroomTeacherId: this.sectionFormTeacherId(),
            active: this.sectionFormActive()
        };
        if (this.sectionFormMode() === 'edit' && this.sectionFormId()) {
            const id = this.sectionFormId()!;
            this.sectionRows.update(items => items.map(section => section.id === id
                ? { ...section, ...payload }
                : section));
            this.toast.success(`Section "${name}" updated.`);
        } else {
            const id = this.nextSectionId();
            const sortOrder = this.sectionRows().filter(section => section.classId === classId).length + 1;
            const newSection: SectionRow = { id, sortOrder, ...payload };
            this.sectionRows.update(items => [...items, newSection]);
            this.toast.success(`Section "${name}" added.`);
        }
        this.sectionFormOpen.set(false);
    }

    openSectionDelete(section: SectionRow): void {
        this.sectionDeleteTarget.set(section);
        this.sectionDeleteError.set('');
        this.sectionDeleteSubmitting.set(false);
        this.sectionDeleteOpen.set(true);
    }

    requestCloseSectionDelete(): void {
        if (this.sectionDeleteSubmitting()) return;
        this.sectionDeleteOpen.set(false);
        this.sectionDeleteTarget.set(null);
        this.sectionDeleteError.set('');
    }

    deleteSection(): void {
        const target = this.sectionDeleteTarget();
        if (!target || this.sectionDeleteSubmitting()) return;
        this.sectionDeleteSubmitting.set(true);
        this.sectionRows.update(items => items.filter(section => section.id !== target.id));
        this.toast.success(`Section "${target.name}" deleted.`);
        this.sectionDeleteSubmitting.set(false);
        this.requestCloseSectionDelete();
    }

    toggleSectionActive(section: SectionRow): void {
        this.sectionRows.update(items => items.map(item => item.id === section.id
            ? { ...item, active: !item.active }
            : item));
        this.toast.success(`Section "${section.name}" ${section.active ? 'deactivated' : 'activated'}.`);
    }

    openSectionGenerator(): void {
        if (!this.selectedClass()) {
            this.toast.warning('Select a class first.');
            return;
        }
        this.sectionGeneratorPattern.set('letters');
        this.sectionGeneratorRange.set('A-F');
        this.sectionGeneratorCapacity.set('');
        this.sectionGeneratorCustom.set('');
        this.sectionGeneratorError.set('');
        this.sectionGeneratorOpen.set(true);
    }

    requestCloseSectionGenerator(): void {
        this.sectionGeneratorOpen.set(false);
        this.sectionGeneratorError.set('');
    }

    generateSectionsPreview(): string[] {
        const pattern = this.sectionGeneratorPattern();
        if (pattern === 'custom') {
            return this.sectionGeneratorCustom()
                .split(',')
                .map(item => item.trim())
                .filter(Boolean);
        }
        const range = this.sectionGeneratorRange().toUpperCase().trim();
        if (pattern === 'letters') {
            const [start, end] = range.split('-').map(value => value.trim());
            if (!start || !end) return [];
            const startCode = start.charCodeAt(0);
            const endCode = end.charCodeAt(0);
            if (Number.isNaN(startCode) || Number.isNaN(endCode) || startCode > endCode) return [];
            return Array.from({ length: endCode - startCode + 1 }, (_, i) => String.fromCharCode(startCode + i));
        }
        const [start, end] = range.split('-').map(value => value.trim());
        const startNum = Number(start);
        const endNum = Number(end);
        if (!Number.isFinite(startNum) || !Number.isFinite(endNum) || startNum > endNum) return [];
        return Array.from({ length: endNum - startNum + 1 }, (_, i) => `${startNum + i}`);
    }

    createGeneratedSections(): void {
        const classId = this.selectedClassId();
        if (!classId) {
            this.sectionGeneratorError.set('Select a class first.');
            return;
        }
        const preview = this.generateSectionsPreview();
        if (!preview.length) {
            this.sectionGeneratorError.set('Provide a valid section pattern.');
            return;
        }
        const capacityValue = this.sectionGeneratorCapacity().trim();
        const capacityNumber = capacityValue ? Number(capacityValue) : null;
        if (capacityValue && (capacityNumber === null || !Number.isFinite(capacityNumber) || capacityNumber < 0)) {
            this.sectionGeneratorError.set('Capacity must be a valid number.');
            return;
        }
        const existingNames = new Set(this.sectionRows()
            .filter(section => section.classId === classId)
            .map(section => section.name.toLowerCase()));
        const toCreate = preview.filter(name => !existingNames.has(name.toLowerCase()));
        const startIndex = this.sectionRows().filter(section => section.classId === classId).length;
        const newSections = toCreate.map((name, index) => ({
            id: this.nextSectionId(),
            classId,
            name,
            code: '',
            capacity: capacityValue ? capacityNumber : null,
            homeroomTeacherId: null,
            active: true,
            sortOrder: startIndex + index + 1
        }));
        if (!newSections.length) {
            this.sectionGeneratorError.set('All generated sections already exist.');
            return;
        }
        this.sectionRows.update(items => [...items, ...newSections]);
        this.toast.success(`Created ${newSections.length} sections.`);
        this.requestCloseSectionGenerator();
    }

    openNewGradingScale(): void {
        this.gradingScaleFormMode.set('add');
        this.gradingScaleFormId.set(null);
        this.gradingScaleFormName.set('');
        this.gradingScaleFormTemplate.set('');
        this.gradingScaleFormType.set('Letter');
        this.gradingScaleFormSchoolScope.set('all');
        this.gradingScaleFormSchoolIds.set([]);
        this.gradingScaleFormPassMark.set('');
        this.gradingScaleFormError.set('');
        this.gradingScaleFormOpen.set(true);
    }

    openEditGradingScale(scale: GradingScale): void {
        this.gradingScaleFormMode.set('edit');
        this.gradingScaleFormId.set(scale.id);
        this.gradingScaleFormName.set(scale.name);
        this.gradingScaleFormTemplate.set('');
        this.gradingScaleFormType.set(scale.type);
        this.gradingScaleFormSchoolScope.set(scale.schoolIds && scale.schoolIds.length ? 'specific' : 'all');
        this.gradingScaleFormSchoolIds.set(scale.schoolIds ? [...scale.schoolIds] : []);
        this.gradingScaleFormPassMark.set(scale.settings.passMark?.toString() || '');
        this.gradingScaleFormError.set('');
        this.gradingScaleFormOpen.set(true);
    }

    requestCloseGradingScaleForm(): void {
        this.gradingScaleFormOpen.set(false);
        this.gradingScaleFormError.set('');
    }

    saveGradingScale(): void {
        const name = this.gradingScaleFormName().trim();
        if (!name) {
            this.gradingScaleFormError.set('Scale name is required.');
            return;
        }
        const type = this.gradingScaleFormType();
        const schoolScope = this.gradingScaleFormSchoolScope();
        const schoolIds = schoolScope === 'specific' ? [...this.gradingScaleFormSchoolIds()] : null;
        if (schoolScope === 'specific' && (!schoolIds || !schoolIds.length)) {
            this.gradingScaleFormError.set('Select at least one school.');
            return;
        }
        const passMarkValue = this.gradingScaleFormPassMark().trim();
        const passMarkNumber = passMarkValue ? Number(passMarkValue) : null;
        if (passMarkValue && (passMarkNumber === null || !Number.isFinite(passMarkNumber) || passMarkNumber < 0)) {
            this.gradingScaleFormError.set('Pass mark must be a valid number.');
            return;
        }
        const templateId = this.gradingScaleFormTemplate();
        const template = templateId ? this.gradingScaleTemplates().find(item => item.id === templateId) : null;
        const settings = this.buildDefaultGradingSettings(passMarkNumber);
        const bands = template ? template.bands.map(band => ({ ...band })) : this.defaultBandsForType(type);
        if (this.gradingScaleFormMode() === 'edit' && this.gradingScaleFormId()) {
            const id = this.gradingScaleFormId()!;
            this.gradingScales.update(items => items.map(scale => scale.id === id
                ? {
                    ...scale,
                    name,
                    type,
                    schoolIds,
                    settings: {
                        ...scale.settings,
                        passMark: passMarkNumber
                    },
                    bands: template ? bands : scale.bands
                }
                : scale));
            this.toast.success(`Grading scale "${name}" updated.`);
        } else {
            const id = this.nextGradingScaleId();
            const newScale: GradingScale = {
                id,
                name,
                type,
                status: 'Active',
                schoolIds,
                bands,
                settings
            };
            this.gradingScales.update(items => [...items, newScale]);
            this.gradingSelectedScaleId.set(id);
            this.toast.success(`Grading scale "${name}" created.`);
        }
        this.gradingScaleFormOpen.set(false);
    }

    toggleGradingScaleMenu(): void {
        const next = !this.gradingScaleMenuOpen();
        this.gradingScaleMenuOpen.set(next);
    }

    closeGradingScaleMenu(): void {
        this.gradingScaleMenuOpen.set(false);
    }

    toggleGradingHeaderMenu(): void {
        this.gradingHeaderMenuOpen.update(open => !open);
    }

    closeGradingHeaderMenu(): void {
        this.gradingHeaderMenuOpen.set(false);
    }

    selectGradingScale(scale: GradingScale): void {
        this.gradingSelectedScaleId.set(scale.id);
        this.gradingActiveTab.set('bands');
        this.closeGradingScaleMenu();
    }

    duplicateGradingScale(): void {
        const scale = this.selectedGradingScale();
        if (!scale) return;
        const id = this.nextGradingScaleId();
        const newScale: GradingScale = {
            ...scale,
            id,
            name: `${scale.name} copy`,
            status: 'Draft',
            bands: scale.bands.map(band => ({ ...band, id: this.nextGradingBandId() })),
            settings: { ...scale.settings }
        };
        this.gradingScales.update(items => [...items, newScale]);
        this.gradingSelectedScaleId.set(id);
        this.toast.success('Grading scale duplicated.');
        this.closeGradingScaleMenu();
    }

    archiveGradingScale(): void {
        const scale = this.selectedGradingScale();
        if (!scale) return;
        this.gradingScales.update(items => items.map(item => item.id === scale.id
            ? { ...item, status: item.status === 'Archived' ? 'Active' : 'Archived' }
            : item));
        this.toast.success(`Grading scale "${scale.name}" ${scale.status === 'Archived' ? 'restored' : 'archived'}.`);
        this.closeGradingScaleMenu();
    }

    openAddGradeBand(): void {
        if (!this.selectedGradingScale()) {
            this.toast.warning('Select a grading scale first.');
            return;
        }
        this.gradingBandFormMode.set('add');
        this.gradingBandFormId.set(null);
        this.gradingBandFormLabel.set('');
        this.gradingBandFormMin.set('');
        this.gradingBandFormMax.set('');
        this.gradingBandFormPass.set(true);
        this.gradingBandFormGpa.set('');
        this.gradingBandFormError.set('');
        this.gradingBandFormOpen.set(true);
    }

    openEditGradeBand(band: GradingBand): void {
        this.gradingBandFormMode.set('edit');
        this.gradingBandFormId.set(band.id);
        this.gradingBandFormLabel.set(band.label);
        this.gradingBandFormMin.set(band.min.toString());
        this.gradingBandFormMax.set(band.max.toString());
        this.gradingBandFormPass.set(band.pass);
        this.gradingBandFormGpa.set(band.gpa?.toString() || '');
        this.gradingBandFormError.set('');
        this.gradingBandFormOpen.set(true);
    }

    requestCloseGradeBandForm(): void {
        this.gradingBandFormOpen.set(false);
        this.gradingBandFormError.set('');
    }

    saveGradeBand(): void {
        const scale = this.selectedGradingScale();
        if (!scale) return;
        const label = this.gradingBandFormLabel().trim();
        if (!label) {
            this.gradingBandFormError.set('Grade label is required.');
            return;
        }
        const minValue = Number(this.gradingBandFormMin().trim());
        const maxValue = Number(this.gradingBandFormMax().trim());
        if (!Number.isFinite(minValue) || !Number.isFinite(maxValue) || minValue >= maxValue) {
            this.gradingBandFormError.set('Min score must be less than max score.');
            return;
        }
        const gpaValueRaw = this.gradingBandFormGpa().trim();
        const gpaValue = gpaValueRaw ? Number(gpaValueRaw) : null;
        if (gpaValueRaw && (gpaValue === null || !Number.isFinite(gpaValue) || gpaValue < 0)) {
            this.gradingBandFormError.set('GPA must be a valid number.');
            return;
        }
        const nextBand: GradingBand = {
            id: this.gradingBandFormId() || this.nextGradingBandId(),
            label,
            min: minValue,
            max: maxValue,
            pass: this.gradingBandFormPass(),
            gpa: gpaValue
        };
        const conflict = scale.settings.preventOverlap
            && scale.bands.some(band => {
                if (band.id === nextBand.id) return false;
                return nextBand.min < band.max && nextBand.max > band.min;
            });
        if (conflict) {
            this.gradingBandFormError.set('Grade band ranges cannot overlap.');
            return;
        }
        this.gradingScales.update(items => items.map(item => {
            if (item.id !== scale.id) return item;
            const bands = item.bands.filter(band => band.id !== nextBand.id);
            bands.push(nextBand);
            return {
                ...item,
                bands: bands.sort((a, b) => b.max - a.max)
            };
        }));
        this.toast.success(`Grade band "${label}" saved.`);
        this.gradingBandFormOpen.set(false);
    }

    resetGradingDefaults(): void {
        const type = this.gradingModel() === 'numeric'
            ? 'Percent'
            : (this.gradingModel() === 'gpa' ? 'GPA' : 'Letter');
        const defaultScale: GradingScale = {
            id: this.nextGradingScaleId(),
            name: 'Default scale',
            type,
            status: 'Active',
            schoolIds: null,
            bands: this.defaultBandsForType(type),
            settings: this.buildDefaultGradingSettings(null)
        };
        this.gradingScales.set([defaultScale]);
        this.gradingSelectedScaleId.set(defaultScale.id);
        this.toast.success('Grading scales reset to defaults.');
    }

    importGradingTemplate(): void {
        this.openNewGradingScale();
        const template = this.gradingScaleTemplates()[0];
        if (template) {
            this.selectGradingTemplate(template.id);
        }
    }

    selectGradingTemplate(templateId: string): void {
        this.gradingScaleFormTemplate.set(templateId);
        if (!templateId) return;
        const template = this.gradingScaleTemplates().find(option => option.id === templateId);
        if (template) {
            this.gradingScaleFormType.set(template.type);
        }
    }

    toggleGradingScaleSchool(name: string, checked: boolean): void {
        this.gradingScaleFormSchoolIds.update(items => {
            if (checked) return items.includes(name) ? items : [...items, name];
            return items.filter(item => item !== name);
        });
    }

    setGradingPassMark(value: string): void {
        const trimmed = value.trim();
        const number = trimmed ? Number(trimmed) : null;
        if (trimmed && (number === null || !Number.isFinite(number) || number < 0)) {
            return;
        }
        this.updateSelectedScaleSettings({ passMark: number });
    }

    setGradingCalculationMethod(value: string): void {
        if (!value) return;
        this.updateSelectedScaleSettings({ calculationMethod: value as GradingScaleSettings['calculationMethod'] });
    }

    setGradingRounding(value: string): void {
        if (!value) return;
        this.updateSelectedScaleSettings({ rounding: value as GradingScaleSettings['rounding'] });
    }

    setGradingTranscriptFormat(value: string): void {
        if (!value) return;
        this.updateSelectedScaleSettings({ transcriptFormat: value as GradingScaleSettings['transcriptFormat'] });
    }

    deleteGradeBand(band: GradingBand): void {
        const scale = this.selectedGradingScale();
        if (!scale) return;
        this.gradingScales.update(items => items.map(item => item.id === scale.id
            ? { ...item, bands: item.bands.filter(existing => existing.id !== band.id) }
            : item));
        this.toast.success(`Grade band "${band.label}" deleted.`);
        this.gradingBandMenuOpenId.set(null);
    }

    toggleGradingBandMenu(id: string, event?: MouseEvent): void {
        event?.stopPropagation();
        const next = this.gradingBandMenuOpenId() === id ? null : id;
        this.gradingBandMenuOpenId.set(next);
    }

    closeGradingBandMenu(): void {
        this.gradingBandMenuOpenId.set(null);
    }

    updateSelectedScaleSettings(patch: Partial<GradingScaleSettings>): void {
        const scale = this.selectedGradingScale();
        if (!scale) return;
        this.gradingScales.update(items => items.map(item => item.id === scale.id
            ? { ...item, settings: { ...item.settings, ...patch } }
            : item));
    }

    selectClass(row: ClassRow): void {
        this.closeAllActionMenus();
        this.selectedClassId.set(row.id);
        this.sectionSearch.set('');
    }

    private closeAllActionMenus(): void {
        this.schoolMenuOpenIndex.set(null);
        this.ouActionsMenuOpen.set(false);
        this.classMenuOpenId.set(null);
        this.classHeaderMenuOpen.set(false);
        this.sectionsMenuOpen.set(false);
        this.sectionMenuOpenId.set(null);
        this.userMenuOpenId.set(null);
    }

    openClassReorder(): void {
        this.classReorderDraft.set(this.sortedClassRows());
        this.classReorderOpen.set(true);
    }

    requestCloseClassReorder(): void {
        this.classReorderOpen.set(false);
        this.classReorderDraft.set([]);
    }

    handleClassReorderDrop(event: CdkDragDrop<ClassRow[]>): void {
        const draft = [...this.classReorderDraft()];
        moveItemInArray(draft, event.previousIndex, event.currentIndex);
        this.classReorderDraft.set(draft);
    }

    saveClassReorder(): void {
        const draft = this.classReorderDraft();
        if (!draft.length) {
            this.requestCloseClassReorder();
            return;
        }
        const orderMap = new Map(draft.map((row, index) => [row.id, index + 1]));
        this.classRows.update(items => items.map(row => ({
            ...row,
            sortOrder: orderMap.get(row.id) ?? row.sortOrder
        })));
        this.toast.success('Class order updated.');
        this.requestCloseClassReorder();
    }

    openSectionReorder(): void {
        const selected = this.selectedClassId();
        if (!selected) return;
        this.sectionReorderDraft.set(this.filteredSections());
        this.sectionReorderOpen.set(true);
    }

    requestCloseSectionReorder(): void {
        this.sectionReorderOpen.set(false);
        this.sectionReorderDraft.set([]);
    }

    handleSectionReorderDrop(event: CdkDragDrop<SectionRow[]>): void {
        const draft = [...this.sectionReorderDraft()];
        moveItemInArray(draft, event.previousIndex, event.currentIndex);
        this.sectionReorderDraft.set(draft);
    }

    saveSectionReorder(): void {
        const draft = this.sectionReorderDraft();
        if (!draft.length) {
            this.requestCloseSectionReorder();
            return;
        }
        const orderMap = new Map(draft.map((row, index) => [row.id, index + 1]));
        this.sectionRows.update(items => items.map(row => ({
            ...row,
            sortOrder: orderMap.get(row.id) ?? row.sortOrder
        })));
        this.toast.success('Section order updated.');
        this.requestCloseSectionReorder();
    }

    openImportModal(type: 'classes' | 'sections'): void {
        this.classImportType.set(type);
        this.classImportFileName.set('');
        this.classImportRows.set([]);
        this.classImportErrors.set([]);
        this.classImportSubmitting.set(false);
        this.classImportOpen.set(true);
    }

    requestCloseImportModal(): void {
        if (this.classImportSubmitting()) return;
        this.classImportOpen.set(false);
        this.classImportRows.set([]);
        this.classImportErrors.set([]);
    }

    handleImportFile(event: Event): void {
        const input = event.target as HTMLInputElement | null;
        if (!input?.files?.length) return;
        const file = input.files[0];
        this.classImportFileName.set(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            const text = String(reader.result || '');
            const { rows, errors } = this.parseCsv(text);
            this.classImportRows.set(rows);
            this.classImportErrors.set(errors);
        };
        reader.readAsText(file);
    }

    confirmImport(): void {
        if (this.classImportSubmitting()) return;
        this.classImportSubmitting.set(true);
        const rows = this.classImportRows();
        if (!rows.length) {
            this.classImportErrors.set(['No rows found in file.']);
            this.classImportSubmitting.set(false);
            return;
        }
        const type = this.classImportType();
        if (type === 'classes') {
            const newRows: ClassRow[] = [];
            rows.forEach(row => {
            const name = (row['name'] || '').trim();
            if (!name) return;
            const code = (row['code'] || '').trim() || undefined;
            const levelType = (row['leveltype'] || row['levelType'] || '').trim() as ClassLevelType | '';
            const active = this.parseCsvBoolean(row['active'], true);
            newRows.push({
                    id: this.nextClassId(),
                    name,
                    code,
                    levelType: levelType || undefined,
                    sortOrder: this.classRows().length + newRows.length + 1,
                    active,
                    schoolIds: null,
                });
            });
            if (newRows.length) {
                this.classRows.update(items => [...items, ...newRows]);
                this.toast.success(`Imported ${newRows.length} classes.`);
                this.requestCloseImportModal();
            } else {
                this.classImportErrors.set(['No valid classes found.']);
                this.classImportSubmitting.set(false);
            }
            return;
        }
        const classByCode = new Map(this.classRows().map(row => [row.code?.toLowerCase() || '', row]));
        const classByName = new Map(this.classRows().map(row => [row.name.toLowerCase(), row]));
        const sectionCounts = new Map<string, number>();
        this.sectionRows().forEach(section => {
            sectionCounts.set(section.classId, (sectionCounts.get(section.classId) || 0) + 1);
        });
        const newSections: SectionRow[] = [];
        rows.forEach(row => {
            const classCode = (row['classcode'] || row['classCode'] || '').trim().toLowerCase();
            const className = (row['classname'] || row['className'] || '').trim().toLowerCase();
            const classRow = classCode ? classByCode.get(classCode) : classByName.get(className);
            if (!classRow) return;
            const name = (row['sectionname'] || row['sectionName'] || '').trim();
            if (!name) return;
            const code = (row['sectioncode'] || row['sectionCode'] || '').trim() || undefined;
            const capacityValue = (row['capacity'] || '').trim();
            const capacityNumber = capacityValue ? Number(capacityValue) : null;
            if (capacityValue && (capacityNumber === null || !Number.isFinite(capacityNumber) || capacityNumber < 0)) return;
            const active = this.parseCsvBoolean(row['active'], true);
            const nextOrder = (sectionCounts.get(classRow.id) || 0) + 1;
            sectionCounts.set(classRow.id, nextOrder);
            newSections.push({
                id: this.nextSectionId(),
                classId: classRow.id,
                name,
                code,
                capacity: capacityValue ? capacityNumber : null,
                homeroomTeacherId: null,
                active,
                sortOrder: nextOrder
            });
        });
        if (newSections.length) {
            this.sectionRows.update(items => [...items, ...newSections]);
            this.toast.success(`Imported ${newSections.length} sections.`);
            this.requestCloseImportModal();
        } else {
            this.classImportErrors.set(['No valid sections found.']);
            this.classImportSubmitting.set(false);
        }
    }

    downloadImportTemplate(type: 'classes' | 'sections'): void {
        const headers = type === 'classes'
            ? ['name', 'code', 'levelType', 'active']
            : ['classCode', 'className', 'sectionName', 'sectionCode', 'capacity', 'active'];
        this.downloadCsv(headers.join(',') + '\n', `${type}-template.csv`);
    }

    exportCsv(type: 'classes' | 'sections'): void {
        if (type === 'classes') {
            const rows = this.classRows().map(row => ([
                row.name,
                row.code || '',
                row.levelType || '',
                row.active ? 'true' : 'false'
            ].join(',')));
            this.downloadCsv(`name,code,levelType,active\n${rows.join('\n')}`, 'classes.csv');
            return;
        }
        const classById = new Map(this.classRows().map(row => [row.id, row]));
        const rows = this.sectionRows().map(section => ([
            classById.get(section.classId)?.code || '',
            classById.get(section.classId)?.name || '',
            section.name,
            section.code || '',
            section.capacity ?? '',
            section.active ? 'true' : 'false'
        ].join(',')));
        this.downloadCsv(`classCode,className,sectionName,sectionCode,capacity,active\n${rows.join('\n')}`, 'sections.csv');
    }

    private parseCsvBoolean(value: string | undefined, fallback: boolean): boolean {
        if (!value) return fallback;
        const normalized = value.trim().toLowerCase();
        if (['true', 'yes', '1'].includes(normalized)) return true;
        if (['false', 'no', '0'].includes(normalized)) return false;
        return fallback;
    }

    private parseCsv(text: string): { rows: Array<Record<string, string>>; errors: string[] } {
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        if (!lines.length) {
            return { rows: [], errors: ['File is empty.'] };
        }
        const headers = lines[0].split(',').map(header => header.trim());
        const rows = lines.slice(1).map(line => {
            const values = line.split(',').map(value => value.trim());
            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            return row;
        });
        return { rows, errors: [] };
    }

    private downloadCsv(text: string, filename: string): void {
        const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    private isClassFormDirty(): boolean {
        if (this.classFormMode() === 'add') {
            return !!this.classFormName().trim()
                || !!this.classFormCode().trim()
                || !!this.classFormLevel()
                || !!this.classFormNotes().trim()
                || !this.classFormActive()
                || this.classFormSchoolScope() === 'specific'
                || this.classFormSchoolIds().length > 0;
        }
        const id = this.classFormId();
        const existing = this.classRows().find(row => row.id === id);
        if (!existing) return true;
        return existing.name !== this.classFormName().trim()
            || (existing.code || '') !== this.classFormCode().trim()
            || (existing.levelType || '') !== (this.classFormLevel() || '')
            || (existing.notes || '') !== this.classFormNotes().trim()
            || existing.active !== this.classFormActive()
            || (existing.schoolIds === null ? 'all' : 'specific') !== this.classFormSchoolScope()
            || (existing.schoolIds || []).join(',') !== this.classFormSchoolIds().join(',');
    }

    private isSectionFormDirty(): boolean {
        if (this.sectionFormMode() === 'add') {
            return !!this.sectionFormName().trim()
                || !!this.sectionFormCode().trim()
                || !!this.sectionFormCapacity().trim()
                || !!this.sectionFormTeacherId()
                || !this.sectionFormActive();
        }
        const id = this.sectionFormId();
        const existing = this.sectionRows().find(row => row.id === id);
        if (!existing) return true;
        return existing.classId !== this.sectionFormClassId()
            || existing.name !== this.sectionFormName().trim()
            || (existing.code || '') !== this.sectionFormCode().trim()
            || (existing.capacity?.toString() || '') !== this.sectionFormCapacity().trim()
            || (existing.homeroomTeacherId || null) !== this.sectionFormTeacherId()
            || existing.active !== this.sectionFormActive();
    }

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
        this.createRole.set('Staff');
        this.createRoleIds.set([this.createRole()]);
        this.createSchoolAccess.set('all');
        this.createSelectedSchools.set([]);
        this.createJobTitle.set('');
        this.createDepartment.set('');
        this.createStaffId.set('');
        this.createTouched.set(false);
        this.isCreateUserModalOpen.set(true);
    }

    closeCreateUserModal(): void {
        this.isCreateUserModalOpen.set(false);
        this.createTouched.set(false);
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
        this.editStaffId.set(user.staffId || '');
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

    toggleCreateSchoolSelection(name: string, checked: boolean): void {
        this.createSelectedSchools.update(items => {
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
                staffId: this.editStaffId().trim() || undefined,
            };
        }));
        this.closeEditUser();
    }

    setEditRole(value: string): void {
        this.editRole.set(this.normalizeRole(value));
    }

    setCreateRole(value: string): void {
        this.createRole.set(this.normalizeRole(value));
    }

    handleCreateRoleChange(event: { ids: string[]; roles?: { name: string }[] }): void {
        this.createRoleIds.set(event.ids);
        if (event.roles?.length) {
            this.createRole.set(this.normalizeRole(event.roles[0].name));
        }
    }

    saveCreateUser(): void {
        this.createTouched.set(true);
        const name = this.createName().trim();
        const email = this.createEmail().trim();
        if (!name || !email || !this.isValidEmail(email)) return;
        const schoolAccess = this.createSchoolAccess() === 'all'
            ? 'all'
            : [...this.createSelectedSchools()];
        this.users.update(items => [
            ...items,
            {
                id: this.nextUserId(),
                name,
                email,
                role: this.createRole(),
                schoolAccess,
                status: 'Active',
                jobTitle: this.createJobTitle().trim() || undefined,
                department: this.createDepartment().trim() || undefined,
                staffId: this.createStaffId().trim() || undefined,
                createdAt: new Date().toISOString(),
            }
        ]);
        this.usersStepSkipped.set(false);
        this.closeCreateUserModal();
    }

    createEmailError(): string {
        if (!this.createTouched()) return '';
        const email = this.createEmail().trim();
        if (!email) return 'Email is required.';
        if (!this.isValidEmail(email)) return 'Enter a valid email address.';
        return '';
    }

    readonly createCanSubmit = computed(() => {
        const name = this.createName().trim();
        const email = this.createEmail().trim();
        if (!name || !email) return false;
        if (!this.isValidEmail(email)) return false;
        if (this.createSchoolAccess() === 'selected' && this.createSelectedSchools().length === 0) return false;
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

    skipUsersStep(): void {
        this.usersStepSkipped.set(true);
        this.attemptedContinue.set(false);
        this.next();
    }

    finish(): void {
        this.router.navigateByUrl('/dashboard');
    }

    private async completeSetup(): Promise<void> {
        this.isSaving.set(true);
        try {
            const schools = this.schoolRows()
                .filter(row => row.status === 'Active')
                .map(row => ({
                    name: row.name.trim(),
                    code: row.code.trim() || undefined
                }));

            for (const school of schools) {
                if (!school.name) continue;
                await firstValueFrom(this.schoolService.createSchool(school));
            }

            this.persistState('completed');
            this.step.set(8);
        } catch {
            this.errorMessage.set('Unable to complete setup. Please try again.');
        } finally {
            this.isSaving.set(false);
        }
    }

    private loadInitialState(): void {
        this.isLoading.set(true);
        this.tenantSettings.getSettings().subscribe({
            next: (tenant: any) => {
                const tenantId = tenant.id || this.tenantService.getTenantId() || '';
                this.tenantId.set(tenantId);
                this.tenantName.set(tenant.name || '');
                const tenantAddress = tenant.contactInfo?.address || {};
                this.country.set(tenantAddress.country || '');
                const hasTenantAddress = !!(
                    tenantAddress.street ||
                    tenantAddress.city ||
                    tenantAddress.state ||
                    tenantAddress.postalCode
                );
                this.tenantAddress.set(hasTenantAddress ? {
                    street: tenantAddress.street || '',
                    city: tenantAddress.city || '',
                    state: tenantAddress.state || '',
                    postalCode: tenantAddress.postalCode || '',
                } : null);
                this.defaultTimezone.set(tenant.timezone || this.defaultTimeZone());
                if (!this.schoolRows().length) {
                    const defaultName = tenant.name || 'School';
                    this.schoolRows.set([this.defaultSchoolRow(defaultName)]);
                }

                const serverState = tenant.extras?.setupProgram as FirstLoginSetupState | undefined;
                const localState = tenantId ? this.setupStore.load(tenantId) : null;
                const state = serverState || localState;

                if (state && state.status === 'in_progress') {
                    this.applyState(state);
                    this.step.set(state.step || 1);
                }

                if (!this.gradingScales().length) {
                    const type = this.gradingModel() === 'numeric'
                        ? 'Percent'
                        : (this.gradingModel() === 'gpa' ? 'GPA' : 'Letter');
                    const defaultScale: GradingScale = {
                        id: this.nextGradingScaleId(),
                        name: 'Default scale',
                        type,
                        status: 'Active',
                        schoolIds: null,
                        bands: this.defaultBandsForType(type),
                        settings: this.buildDefaultGradingSettings(null)
                    };
                    this.gradingScales.set([defaultScale]);
                }
                if (!this.gradingSelectedScaleId() && this.gradingScales().length) {
                    this.gradingSelectedScaleId.set(this.gradingScales()[0].id);
                }

                this.isLoading.set(false);
            },
            error: () => {
                this.errorMessage.set('Unable to load setup details. Please refresh and try again.');
                this.isLoading.set(false);
            }
        });
    }

    private initAutosave(): void {
        if (this.autosaveInitialized) return;
        this.autosaveInitialized = true;

        runInInjectionContext(this.injector, () => {
            effect(() => {
                this.step();
                this.schoolRows();
                this.orgUnits();
                this.orgUnitMemberIds();
                this.orgUnitRoles();
                this.levels();
                this.levelsTemplate();
                this.classRows();
                this.sectionRows();
                this.gradingModel();
                this.gradingScales();
                this.users();

                if (!this.isLoading()) {
                    this.persistState('in_progress');
                }
            });
        });
    }

    private applyState(state: FirstLoginSetupState): void {
        if (!state.data) return;
        const data = state.data as FirstLoginSetupData;
        this.step.set(state.step || 1);
        if (data.schoolRows?.length) {
            this.schoolRows.set(data.schoolRows.map(row => this.normalizeSchoolRow(row)));
        }
        if (data.orgUnits?.length) {
            this.orgUnits.set(data.orgUnits);
        } else if (data.departments?.length) {
            this.orgUnits.set(this.migrateDepartments(data.departments));
        }
        this.syncOrgUnitCounter();
        if (data.orgUnitMemberIds) {
            this.orgUnitMemberIds.set(data.orgUnitMemberIds);
        }
        if (data.orgUnitRoles) {
            this.orgUnitRoles.set(data.orgUnitRoles);
        }
        this.levelsTemplate.set(data.levelsTemplate || 'k12');
        this.levels.set(data.levels?.length ? data.levels : this.defaultLevels(this.levelsTemplate()));
        const migrated = this.migrateClasses(data.classes);
        if (migrated.classRows.length) {
            this.classRows.set(migrated.classRows);
        }
        if (migrated.isLegacy) {
            if (migrated.sectionRows.length) {
                this.sectionRows.set(migrated.sectionRows);
            }
        } else if (data.sections?.length) {
            this.sectionRows.set(data.sections);
        }
        this.gradingModel.set(data.gradingModel || 'letter');
        if (data.gradingScales?.length) {
            this.gradingScales.set(data.gradingScales);
        } else {
            const defaultScale: GradingScale = {
                id: this.nextGradingScaleId(),
                name: 'Default scale',
                type: this.gradingModel() === 'numeric' ? 'Percent' : (this.gradingModel() === 'gpa' ? 'GPA' : 'Letter'),
                status: 'Active',
                schoolIds: null,
                bands: this.defaultBandsForType(this.gradingModel() === 'numeric' ? 'Percent' : (this.gradingModel() === 'gpa' ? 'GPA' : 'Letter')),
                settings: this.buildDefaultGradingSettings(null)
            };
            this.gradingScales.set([defaultScale]);
        }
        if (data.users?.length) {
            this.users.set(this.normalizeUserRows(data.users));
        }
        this.usersStepSkipped.set(!!data.usersStepSkipped);
        this.syncClassCounter();
        this.syncSectionCounter();
        if (!this.selectedClassId() && this.classRows().length) {
            this.selectedClassId.set(this.classRows()[0].id);
        }
        if (!this.gradingSelectedScaleId() && this.gradingScales().length) {
            this.gradingSelectedScaleId.set(this.gradingScales()[0].id);
        }
    }

    private persistState(status: 'in_progress' | 'skipped' | 'completed'): void {
        const tenantId = this.tenantId();
        if (!tenantId) return;

        const payload: FirstLoginSetupState = {
            status,
            step: this.step(),
            startedAt: status === 'in_progress' ? new Date().toISOString() : undefined,
            skippedAt: status === 'skipped' ? new Date().toISOString() : undefined,
            completedAt: status === 'completed' ? new Date().toISOString() : undefined,
            data: {
                schoolRows: this.schoolRows(),
                orgUnits: this.orgUnits(),
                orgUnitMemberIds: this.orgUnitMemberIds(),
                orgUnitRoles: this.orgUnitRoles(),
                levelsTemplate: this.levelsTemplate(),
                levels: this.levels(),
                classes: this.classRows(),
                sections: this.sectionRows(),
                gradingModel: this.gradingModel(),
                gradingScales: this.gradingScales(),
                users: this.users(),
                usersStepSkipped: this.usersStepSkipped(),
            }
        };

        this.setupStore.save(tenantId, payload);
        this.tenantSettings.updateSettings({
            extras: {
                setupProgram: payload
            }
        }).subscribe();
    }

    private defaultSchoolRow(name: string): SchoolRow {
        const code = this.generateSchoolCode(name);
        return {
            name,
            code,
            country: this.country(),
            timezone: this.defaultTimezone(),
            status: 'Active'
            ,
            address: {},
        };
    }

    private normalizeSchoolRow(row: Partial<SchoolRow>): SchoolRow {
        return {
            name: row.name?.trim() || '',
            code: row.code?.trim() || '',
            country: row.country?.trim() || this.country(),
            timezone: row.timezone?.trim() || this.defaultTimezone(),
            status: row.status || 'Active'
            ,
            address: row.address || {},
        };
    }

    private generateSchoolCode(name: string): string {
        const trimmed = name.trim().toLowerCase();
        if (!trimmed) return '';
        return trimmed
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 32);
    }

    isValidCountry(value: string): boolean {
        const trimmed = value.trim().toLowerCase();
        if (!trimmed) return false;
        return this.countryOptions().some(option => option.label.toLowerCase() === trimmed);
    }

    isValidTimezone(value: string): boolean {
        const trimmed = value.trim();
        if (!trimmed) return false;
        return this.timezones().includes(trimmed);
    }

    schoolFormCodeError(): string {
        if (!this.schoolFormTouched()) return '';
        const code = this.schoolFormCode().trim();
        if (!code) return 'School code is required.';
        if (!/^[a-z0-9-]+$/.test(code)) {
            return 'Use lowercase letters, numbers, and hyphens.';
        }
        return '';
    }

    schoolFormCountryError(): string {
        if (!this.schoolFormTouched()) return '';
        const value = this.schoolFormCountry().trim();
        if (!value) return 'Select a country or region.';
        if (!this.isValidCountry(value)) return 'Select a valid country or region.';
        return '';
    }

    schoolFormTimezoneError(): string {
        if (!this.schoolFormTouched()) return '';
        const value = this.schoolFormTimezone().trim();
        if (!value) return 'Select a time zone.';
        if (!this.isValidTimezone(value)) return 'Select a valid time zone.';
        return '';
    }

    private defaultLevels(template: 'k12' | 'primary_secondary' | 'custom'): string[] {
        if (template === 'primary_secondary') {
            return ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'Secondary 1', 'Secondary 2', 'Secondary 3', 'Secondary 4'];
        }
        if (template === 'custom') {
            return [''];
        }
        return ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    }

    private buildGradingScale(model: 'letter' | 'numeric' | 'gpa' | 'custom'): Array<{ label: string; value: string }> {
        if (model === 'numeric') {
            return [
                { label: '90–100', value: 'A' },
                { label: '80–89', value: 'B' },
                { label: '70–79', value: 'C' },
                { label: '60–69', value: 'D' },
                { label: 'Below 60', value: 'F' }
            ];
        }
        if (model === 'gpa') {
            return [
                { label: '4.0', value: 'Excellent' },
                { label: '3.0', value: 'Good' },
                { label: '2.0', value: 'Satisfactory' },
                { label: '1.0', value: 'Needs improvement' }
            ];
        }
        if (model === 'custom') {
            return [
                { label: 'Define your scale in Settings', value: 'Custom' }
            ];
        }
        return [
            { label: 'A', value: 'Excellent' },
            { label: 'B', value: 'Good' },
            { label: 'C', value: 'Satisfactory' },
            { label: 'D', value: 'Needs improvement' },
            { label: 'F', value: 'Unsatisfactory' }
        ];
    }

    private buildDefaultGradingSettings(passMark: number | null): GradingScaleSettings {
        return {
            passMark,
            allowDecimals: false,
            preventOverlap: true,
            calculationMethod: 'Average',
            rounding: 'Nearest',
            showGpa: true,
            showPercent: true,
            transcriptFormat: 'Letter'
        };
    }

    private defaultBandsForType(type: GradingScaleType): GradingBand[] {
        if (type === 'Percent') {
            return [
                { id: this.nextGradingBandId(), label: 'A', min: 90, max: 100, pass: true, gpa: null },
                { id: this.nextGradingBandId(), label: 'B', min: 80, max: 89, pass: true, gpa: null },
                { id: this.nextGradingBandId(), label: 'C', min: 70, max: 79, pass: true, gpa: null },
                { id: this.nextGradingBandId(), label: 'D', min: 60, max: 69, pass: true, gpa: null },
                { id: this.nextGradingBandId(), label: 'F', min: 0, max: 59, pass: false, gpa: null }
            ];
        }
        if (type === 'GPA') {
            return [
                { id: this.nextGradingBandId(), label: '4.0', min: 90, max: 100, pass: true, gpa: 4.0 },
                { id: this.nextGradingBandId(), label: '3.0', min: 80, max: 89, pass: true, gpa: 3.0 },
                { id: this.nextGradingBandId(), label: '2.0', min: 70, max: 79, pass: true, gpa: 2.0 },
                { id: this.nextGradingBandId(), label: '1.0', min: 60, max: 69, pass: true, gpa: 1.0 },
                { id: this.nextGradingBandId(), label: '0.0', min: 0, max: 59, pass: false, gpa: 0.0 }
            ];
        }
        if (type === 'Rubric') {
            return [
                { id: this.nextGradingBandId(), label: 'Exemplary', min: 90, max: 100, pass: true, gpa: null },
                { id: this.nextGradingBandId(), label: 'Proficient', min: 75, max: 89, pass: true, gpa: null },
                { id: this.nextGradingBandId(), label: 'Developing', min: 60, max: 74, pass: true, gpa: null },
                { id: this.nextGradingBandId(), label: 'Beginning', min: 0, max: 59, pass: false, gpa: null }
            ];
        }
        return [
            { id: this.nextGradingBandId(), label: 'A', min: 90, max: 100, pass: true, gpa: null },
            { id: this.nextGradingBandId(), label: 'B', min: 80, max: 89, pass: true, gpa: null },
            { id: this.nextGradingBandId(), label: 'C', min: 70, max: 79, pass: true, gpa: null },
            { id: this.nextGradingBandId(), label: 'D', min: 60, max: 69, pass: true, gpa: null },
            { id: this.nextGradingBandId(), label: 'F', min: 0, max: 59, pass: false, gpa: null }
        ];
    }

    private gradingScaleTemplates(): Array<{ id: string; label: string; type: GradingScaleType; bands: GradingBand[] }> {
        return [
            { id: 'letter-default', label: 'Default letter scale', type: 'Letter', bands: this.defaultBandsForType('Letter') },
            { id: 'percent-default', label: 'Percent scale (A–F)', type: 'Percent', bands: this.defaultBandsForType('Percent') },
            { id: 'gpa-default', label: 'GPA scale (4.0)', type: 'GPA', bands: this.defaultBandsForType('GPA') },
            { id: 'rubric-default', label: 'Rubric scale', type: 'Rubric', bands: this.defaultBandsForType('Rubric') }
        ];
    }

    private nextGradingScaleId(): string {
        const maxId = this.gradingScales().reduce((max, scale) => {
            const value = Number(scale.id.replace(/[^\d]/g, ''));
            return Number.isFinite(value) ? Math.max(max, value) : max;
        }, 0);
        return `scale-${maxId + 1}`;
    }

    private nextGradingBandId(): string {
        const scales = this.gradingScales();
        const maxId = scales.reduce((max, scale) => {
            return scale.bands.reduce((innerMax, band) => {
                const value = Number(band.id.replace(/[^\d]/g, ''));
                return Number.isFinite(value) ? Math.max(innerMax, value) : innerMax;
            }, max);
        }, 0);
        return `band-${maxId + 1}`;
    }

    private fallbackTimezones(): string[] {
        return [
            'UTC',
            'Africa/Accra',
            'Africa/Johannesburg',
            'America/Chicago',
            'America/Los_Angeles',
            'America/New_York',
            'Asia/Dubai',
            'Asia/Kolkata',
            'Asia/Singapore',
            'Europe/London',
            'Europe/Paris'
        ];
    }

    private defaultTimeZone(): string {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        } catch {
            return 'UTC';
        }
    }

    private buildOrgUnitTree(units: OrgUnit[]): OrgUnitNode[] {
        const nodeMap = new Map<string, OrgUnitNode>();
        for (const unit of units) {
            nodeMap.set(unit.id, { ...unit, children: [] });
        }
        const roots: OrgUnitNode[] = [];
        for (const node of nodeMap.values()) {
            if (node.parentId && nodeMap.has(node.parentId)) {
                nodeMap.get(node.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        }
        const sortNodes = (nodes: OrgUnitNode[]) => {
            nodes.sort((a, b) => a.name.localeCompare(b.name));
            nodes.forEach(child => sortNodes(child.children));
        };
        sortNodes(roots);
        return roots;
    }

    private buildOrgUnitPath(activeId: string | null): string {
        if (!activeId) return '';
        const nodes = new Map(this.orgUnits().map(unit => [unit.id, unit]));
        const path: string[] = [];
        let current = nodes.get(activeId);
        while (current) {
            path.unshift(current.name);
            if (!current.parentId) break;
            current = nodes.get(current.parentId);
        }
        return path.join(' / ');
    }

    private migrateDepartments(departments: string[]): OrgUnit[] {
        return departments
            .filter(name => name.trim().length)
            .map(name => ({
                id: this.nextOrgUnitId(),
                name,
                type: 'Department',
                status: 'Active',
            }));
    }

    private syncOrgUnitCounter(): void {
        const maxId = this.orgUnits().reduce((max, unit) => {
            const match = /^org-unit-(\d+)$/.exec(unit.id);
            if (!match) return max;
            return Math.max(max, Number(match[1]));
        }, 0);
        this.orgUnitCounter = Math.max(this.orgUnitCounter, maxId);
    }

    private nextOrgUnitId(): string {
        this.orgUnitCounter += 1;
        return `org-unit-${this.orgUnitCounter}`;
    }

    isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

    schoolAccessLabel(user: UserRow): string {
        if (user.schoolAccess === 'all') return 'All schools';
        const count = user.schoolAccess.length;
        return count === 1 ? '1 school' : `${count} schools`;
    }

    private migrateClasses(data?: FirstLoginSetupData['classes']): {
        classRows: ClassRow[];
        sectionRows: SectionRow[];
        isLegacy: boolean;
    } {
        if (!data || !data.length) return { classRows: [], sectionRows: [], isLegacy: false };
        const first = data[0] as any;
        const isLegacy = typeof first.level === 'string' || typeof first.sections === 'string';
        if (!isLegacy) {
            return { classRows: data as ClassRow[], sectionRows: [], isLegacy: false };
        }
        const legacyRows = data as Array<{ name: string; level: string; sections: string }>;
        const classRows: ClassRow[] = [];
        const sectionRows: SectionRow[] = [];
        legacyRows.forEach((row, index) => {
            const classId = this.nextClassId();
            classRows.push({
                id: classId,
                name: row.name.trim(),
                code: '',
                levelType: '',
                sortOrder: index + 1,
                active: true,
                schoolIds: null,
            });
            const sections = row.sections
                .split(',')
                .map(item => item.trim())
                .filter(Boolean);
            sections.forEach((sectionName, sectionIndex) => {
                sectionRows.push({
                    id: this.nextSectionId(),
                    classId,
                    name: sectionName,
                    code: '',
                    capacity: null,
                    homeroomTeacherId: null,
                    active: true,
                    sortOrder: sectionIndex + 1
                });
            });
        });
        return { classRows, sectionRows, isLegacy: true };
    }

    private syncClassCounter(): void {
        const maxId = this.classRows().reduce((max, row) => {
            const match = /^class-(\d+)$/.exec(row.id);
            if (!match) return max;
            return Math.max(max, Number(match[1]));
        }, 0);
        this.classCounter = Math.max(this.classCounter, maxId);
    }

    private syncSectionCounter(): void {
        const maxId = this.sectionRows().reduce((max, row) => {
            const match = /^section-(\d+)$/.exec(row.id);
            if (!match) return max;
            return Math.max(max, Number(match[1]));
        }, 0);
        this.sectionCounter = Math.max(this.sectionCounter, maxId);
    }

    private nextClassId(): string {
        this.classCounter += 1;
        return `class-${this.classCounter}`;
    }

    private nextSectionId(): string {
        this.sectionCounter += 1;
        return `section-${this.sectionCounter}`;
    }

    private normalizeClassLevel(value?: string): ClassLevelType | '' | undefined {
        if (!value) return undefined;
        const options: ClassLevelType[] = ['Early Years', 'Primary', 'JHS', 'SHS', 'College', 'Other'];
        return options.includes(value as ClassLevelType) ? (value as ClassLevelType) : '';
    }
}
