import { EnvironmentInjector, Injectable, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { MbTableColumn } from '@mindbloom/ui';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AddressValue } from '../../../../shared/components/address/address.component';
import { COUNTRY_OPTIONS } from '../../../../shared/components/country-select/country-select.component';
import { TIMEZONE_OPTIONS } from '../../../../shared/components/timezone-select/timezone-select.component';
import { TenantSettingsService } from '../../../../core/services/tenant-settings.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { SchoolService } from '../../../../core/school/school.service';
import type { FirstLoginSetupState } from '../../../../core/types/first-login-setup-state';
import { ToastService } from '../../../../core/ui/toast/toast.service';
import { ClassesSectionsFacade } from './classes-sections/classes-sections.facade';
import {
    FirstLoginSetupData,
    GradingBand,
    GradingScale,
    GradingScaleSettings,
    GradingScaleType,
    OrgUnit,
    OrgUnitDeleteImpact,
    OrgUnitNode,
    OrgUnitRole,
    OrgUnitStatus,
    OrgUnitType,
    SchoolRow,
    UserRow,
} from './tenant-workspace-setup.models';

@Injectable()
export class TenantWorkspaceSetupFacade {
    private readonly tenantSettings = inject(TenantSettingsService);
    private readonly tenantService = inject(TenantService);
    private readonly schoolService = inject(SchoolService);
    private readonly router = inject(Router);
    private readonly injector = inject(EnvironmentInjector);
    private readonly toast = inject(ToastService);
    private readonly classesSections = inject(ClassesSectionsFacade);

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
    readonly classRows = this.classesSections.classRows;
    readonly sectionRows = this.classesSections.sectionRows;

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
    usersStepSkipped = signal(false);

    private orgUnitCounter = 0;

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
            const roleName = user.roleName || '';
            return (
                user.name.toLowerCase().includes(search) ||
                user.email.toLowerCase().includes(search) ||
                roleName.toLowerCase().includes(search)
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
            cell: row => row.roleName || '—'
        },
        {
            key: 'status',
            label: 'Status',
            cell: row => row.status
        }
    ];

    readonly stepLabels = [
        'Schools',
        'Users',
        'Organizational units',
        'Academic structure',
        'Classes & sections',
        'Grading system',
        'Review & activate'
    ];

    readonly isReviewStep = computed(() => this.step() === 7);
    readonly isDoneStep = computed(() => this.step() === 8);
    readonly showErrors = computed(() => this.attemptedContinue());

    readonly levelsError = computed(() => {
        if (!this.showErrors() || this.step() !== 4) return '';
        return this.levels().some(level => level.trim()) ? '' : 'Add at least one level.';
    });

    readonly activeSchoolNames = computed(() => this.schoolRows()
        .filter(row => row.status === 'Active')
        .map(row => row.name)
    );

    readonly departmentOptions = computed(() => {
        const names = this.orgUnits()
            .filter(unit => unit.type === 'Department' && unit.status === 'Active')
            .map(unit => unit.name.trim())
            .filter(Boolean);
        return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    });

    readonly canContinueUsersStep = computed(() => this.users().length > 0 || this.usersStepSkipped());

    readonly reviewReady = computed(() =>
        this.schoolsValid()
        && this.canContinueUsersStep()
        && this.levels().length > 0
        && this.classRows().length > 0
        && this.sectionRows().length > 0
    );

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


    init(): void {
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

    async next(): Promise<void> {
        if (!this.canContinue()) {
            this.attemptedContinue.set(true);
            return;
        }
        if (this.step() < 7) {
            const saved = await this.saveCurrentStep();
            if (!saved) return;
            this.step.set(this.step() + 1);
            this.attemptedContinue.set(false);
            this.persistState('in_progress');
            return;
        }
        await this.completeSetup();
    }

    async goToStep(index: number): Promise<void> {
        const target = Math.min(Math.max(index, 1), 7);
        if (target > this.step()) {
            const saved = await this.saveCurrentStep();
            if (!saved) return;
        }
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

    private async saveCurrentStep(): Promise<boolean> {
        this.errorMessage.set('');
        try {
            if (this.step() === 1) {
                await this.saveSchoolsToApi();
            }
            return true;
        } catch {
            this.errorMessage.set('Unable to save changes. Please try again.');
            return false;
        }
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

    private async saveSchoolsToApi(): Promise<void> {
        const rows = this.schoolRows();
        if (!rows.length) return;
        const nextRows = [...rows];
        for (let index = 0; index < rows.length; index += 1) {
            const row = rows[index];
            if (row.status !== 'Active') continue;
            if (row.id) continue;
            const name = row.name.trim();
            if (!name) continue;
            const code = row.code.trim();
            const saved = await firstValueFrom(this.schoolService.createSchool({
                name,
                code: code || undefined
            }));
            const savedId = (saved as any).id || (saved as any)._id;
            nextRows[index] = {
                ...row,
                id: savedId || row.id
            };
        }
        this.schoolRows.set(nextRows);
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

    trackOrgUnit = (_: number, node: OrgUnitNode) => node.id;
    trackOrgUnitRole = (_: number, role: OrgUnitRole) => role.id;

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

    private closeAllActionMenus(): void {
        this.schoolMenuOpenIndex.set(null);
        this.ouActionsMenuOpen.set(false);
    }

    finish(): void {
        this.router.navigateByUrl('/dashboard');
    }

    private async completeSetup(): Promise<void> {
        this.isSaving.set(true);
        try {
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

                const state = tenant.extras?.setupProgram as FirstLoginSetupState | undefined;

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
        this.classesSections.applyState(data);
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
            this.users.set(data.users);
        }
        this.usersStepSkipped.set(!!data.usersStepSkipped);
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

}
