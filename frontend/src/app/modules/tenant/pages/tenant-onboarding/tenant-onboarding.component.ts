import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
    MbAlertComponent,
    MbButtonComponent,
    MbCardComponent,
    MbCheckboxComponent,
    MbFormFieldComponent,
    MbInputComponent,
} from '@mindbloom/ui';
import { TenantSettingsService } from '../../../../core/services/tenant-settings.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { SchoolService } from '../../../../core/school/school.service';
import { SchoolContextService } from '../../../../core/school/school-context.service';
import { TenantOnboardingService, TenantOnboardingState, OnboardingSchoolRow } from '../../../../core/services/tenant-onboarding.service';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';

type SchoolMode = 'single' | 'multi';

@Component({
    selector: 'app-tenant-onboarding',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MbCardComponent,
        MbFormFieldComponent,
        MbInputComponent,
        MbCheckboxComponent,
        MbButtonComponent,
        MbAlertComponent,
    ],
    templateUrl: './tenant-onboarding.component.html',
    styleUrls: ['./tenant-onboarding.component.scss']
})
export class TenantOnboardingComponent implements OnInit {
    private readonly tenantSettings = inject(TenantSettingsService);
    private readonly tenantService = inject(TenantService);
    private readonly schoolService = inject(SchoolService);
    private readonly schoolContext = inject(SchoolContextService);
    private readonly onboardingStore = inject(TenantOnboardingService);
    private readonly userService = inject(UserService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    step = signal<1 | 2 | 3 | 4>(1);
    isLoading = signal(true);
    isSaving = signal(false);
    errorMessage = signal('');

    tenantName = signal('');
    tenantCode = signal('');

    orgCountry = signal('');
    orgCity = signal('');
    orgAddress = signal('');
    orgDomain = signal('');
    orgTimezone = signal(this.defaultTimeZone());
    orgLocale = signal('en-US');

    schoolMode = signal<SchoolMode>('single');
    schoolRows = signal<OnboardingSchoolRow[]>([]);
    existingSchoolCount = computed(() => this.schoolRows().filter(row => row.existing).length);

    editions = signal<Array<{ id: string; name: string; displayName: string; description?: string | null; features?: Record<string, string> }>>([]);
    selectedEditionId = signal<string>('');
    selectedEditionName = signal<string>('');

    createExtraAdmin = signal(false);
    adminName = signal('');
    adminEmail = signal('');
    adminPassword = signal('');

    readonly reviewSchools = computed(() => this.schoolRows().map(row => row.name).filter(Boolean));
    private persistTimer: number | null = null;

    constructor() {
        effect(() => {
            this.step();
            this.orgCountry();
            this.orgCity();
            this.orgAddress();
            this.orgDomain();
            this.orgTimezone();
            this.orgLocale();
            this.schoolMode();
            this.schoolRows();
            this.selectedEditionId();
            this.selectedEditionName();
            this.createExtraAdmin();
            this.adminName();
            this.adminEmail();

            if (this.isLoading()) {
                return;
            }

            this.schedulePersist();
        });
    }

    ngOnInit(): void {
        this.loadInitialState();
    }

    private loadInitialState(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.tenantSettings.getSettings().subscribe({
            next: (tenant) => {
                this.tenantName.set(tenant.name || 'Organization');
                this.tenantCode.set(tenant.subdomain || '');
                this.orgDomain.set(tenant.customization?.customDomain || '');
                this.orgLocale.set(tenant.locale || 'en-US');
                this.orgTimezone.set(tenant.timezone || this.defaultTimeZone());

                const tenantId = tenant.id || this.tenantService.getTenantId();
                if (tenantId) {
                    const saved = this.onboardingStore.load(tenantId);
                    if (saved && !saved.completed) {
                        this.applySavedState(saved);
                    }
                }

                this.loadSchools();
                this.loadEditions();
                this.prefillAdmin();
                this.isLoading.set(false);
            },
            error: () => {
                this.errorMessage.set('Unable to load onboarding details. Please refresh and try again.');
                this.isLoading.set(false);
            }
        });
    }

    private loadSchools(): void {
        this.schoolService.listSchools().subscribe({
            next: (schools) => {
                if (schools.length > 1) {
                    this.schoolMode.set('multi');
                }
                if (schools.length > 0) {
                    this.schoolRows.set(schools.map(s => ({
                        id: s.id,
                        name: s.name,
                        code: s.code,
                        existing: true
                    })));
                } else {
                    const defaultName = this.tenantName() || 'School';
                    this.schoolRows.set([{ name: defaultName }]);
                }
            },
            error: () => {
                if (!this.schoolRows().length) {
                    this.schoolRows.set([{ name: this.tenantName() || 'School' }]);
                }
            }
        });
    }

    private loadEditions(): void {
        this.tenantService.listPublicEditions().subscribe({
            next: (editions) => {
                const active = editions.filter(e => e.isActive !== false);
                this.editions.set(active);
                if (!this.selectedEditionId() && active.length) {
                    this.selectEdition(active[0]);
                }
            },
            error: () => {
                this.editions.set([]);
            }
        });
    }

    private prefillAdmin(): void {
        const user = this.authService.getCurrentUser();
        if (user) {
            this.adminName.set(user.name || '');
            this.adminEmail.set(user.email || '');
        }
    }

    setSchoolMode(mode: SchoolMode): void {
        this.schoolMode.set(mode);
        if (mode === 'single' && this.schoolRows().length > 1) {
            const existing = this.schoolRows().filter(row => row.existing);
            const first = existing[0] || this.schoolRows()[0];
            this.schoolRows.set(first ? [first] : [{ name: this.tenantName() || 'School' }]);
        }
    }

    addSchoolRow(): void {
        this.schoolRows.update(rows => [...rows, { name: '' }]);
    }

    removeSchoolRow(index: number): void {
        this.schoolRows.update(rows => rows.filter((_, idx) => idx !== index));
    }

    updateSchoolName(index: number, value: string): void {
        this.schoolRows.update(rows => rows.map((row, idx) => idx === index ? { ...row, name: value } : row));
    }

    updateSchoolCode(index: number, value: string): void {
        this.schoolRows.update(rows => rows.map((row, idx) => idx === index ? { ...row, code: value } : row));
    }

    selectEdition(edition: { id: string; displayName?: string; name: string }): void {
        this.selectedEditionId.set(edition.id);
        this.selectedEditionName.set(edition.displayName || edition.name);
    }

    back(): void {
        const current = this.step();
        if (current > 1) {
            this.step.set((current - 1) as 1 | 2 | 3 | 4);
            this.persistState();
        }
    }

    async next(): Promise<void> {
        this.errorMessage.set('');
        const current = this.step();

        if (current === 1) {
            const ok = await this.saveOrganization();
            if (!ok) return;
        }
        if (current === 2) {
            const ok = await this.saveSchools();
            if (!ok) return;
        }
        if (current === 3) {
            const ok = await this.saveEdition();
            if (!ok) return;
        }
        if (current === 4) {
            await this.finishOnboarding();
            return;
        }

        if (current < 4) {
            this.step.set((current + 1) as 1 | 2 | 3 | 4);
            this.persistState();
        }
    }

    private async saveOrganization(): Promise<boolean> {
        this.isSaving.set(true);
        try {
            await firstValueFrom(this.tenantSettings.updateSettings({
                customization: {
                    customDomain: this.orgDomain().trim() || undefined
                },
                locale: this.orgLocale().trim() || undefined,
                timezone: this.orgTimezone().trim() || undefined,
                extras: {
                    onboarding: {
                        country: this.orgCountry().trim() || undefined,
                        city: this.orgCity().trim() || undefined,
                        address: this.orgAddress().trim() || undefined,
                    }
                }
            }));
            return true;
        } catch {
            this.errorMessage.set('Unable to save organization details. Please review and try again.');
            return false;
        } finally {
            this.isSaving.set(false);
        }
    }

    private async saveSchools(): Promise<boolean> {
        const rows = this.schoolRows().filter(row => row.name.trim().length);
        if (!rows.length) {
            this.errorMessage.set('Please add at least one school.');
            return false;
        }

        this.isSaving.set(true);
        try {
            const newRows = rows.filter(row => !row.existing);
            for (const row of newRows) {
                await firstValueFrom(this.schoolService.createSchool({
                    name: row.name.trim(),
                    code: row.code?.trim() || undefined
                }));
            }
            if (newRows.length) {
                this.schoolContext.refreshSchools();
            }
            return true;
        } catch {
            this.errorMessage.set('Unable to save schools. Please try again.');
            return false;
        } finally {
            this.isSaving.set(false);
        }
    }

    private async saveEdition(): Promise<boolean> {
        if (!this.selectedEditionId()) {
            this.errorMessage.set('Please select an edition to continue.');
            return false;
        }

        this.isSaving.set(true);
        try {
            await firstValueFrom(this.tenantSettings.updateSettings({
                extras: {
                    onboarding: {
                        editionId: this.selectedEditionId(),
                        editionName: this.selectedEditionName()
                    }
                }
            }));
            return true;
        } catch {
            this.errorMessage.set('Unable to save edition selection. Please try again.');
            return false;
        } finally {
            this.isSaving.set(false);
        }
    }

    private async finishOnboarding(): Promise<void> {
        this.isSaving.set(true);
        try {
            if (this.createExtraAdmin()) {
                if (!this.adminName().trim() || !this.adminEmail().trim() || this.adminPassword().trim().length < 8) {
                    this.errorMessage.set('Please provide admin name, email, and a valid password.');
                    this.isSaving.set(false);
                    return;
                }
                await firstValueFrom(this.userService.createUser({
                    name: this.adminName().trim(),
                    email: this.adminEmail().trim(),
                    password: this.adminPassword().trim()
                }));
            }

            const tenantId = this.tenantService.getTenantId();
            if (tenantId) {
                this.onboardingStore.save(tenantId, {
                    step: 4,
                    completed: true,
                    org: {
                        country: this.orgCountry(),
                        city: this.orgCity(),
                        addressLine: this.orgAddress(),
                        domain: this.orgDomain(),
                        timezone: this.orgTimezone(),
                        locale: this.orgLocale(),
                    },
                    schools: { mode: this.schoolMode(), rows: this.schoolRows() },
                    edition: { id: this.selectedEditionId(), name: this.selectedEditionName() },
                    admin: {
                        createExtraAdmin: this.createExtraAdmin(),
                        name: this.adminName(),
                        email: this.adminEmail(),
                    }
                });
            }
            await this.router.navigateByUrl('/dashboard');
        } catch {
            this.errorMessage.set('Unable to complete onboarding. Please try again.');
        } finally {
            this.isSaving.set(false);
        }
    }

    private applySavedState(saved: TenantOnboardingState): void {
        this.step.set(saved.step);
        this.orgCountry.set(saved.org.country || '');
        this.orgCity.set(saved.org.city || '');
        this.orgAddress.set(saved.org.addressLine || '');
        this.orgDomain.set(saved.org.domain || '');
        this.orgTimezone.set(saved.org.timezone || this.defaultTimeZone());
        this.orgLocale.set(saved.org.locale || 'en-US');
        this.schoolMode.set(saved.schools.mode || 'single');
        if (saved.schools.rows?.length) {
            this.schoolRows.set(saved.schools.rows);
        }
        if (saved.edition?.id) {
            this.selectedEditionId.set(saved.edition.id);
            this.selectedEditionName.set(saved.edition.name || '');
        }
        this.createExtraAdmin.set(saved.admin.createExtraAdmin);
        if (saved.admin.name) this.adminName.set(saved.admin.name);
        if (saved.admin.email) this.adminEmail.set(saved.admin.email);
    }

    private persistState(): void {
        const tenantId = this.tenantService.getTenantId();
        if (!tenantId) return;
        const snapshot: TenantOnboardingState = {
            step: this.step(),
            completed: false,
            org: {
                country: this.orgCountry(),
                city: this.orgCity(),
                addressLine: this.orgAddress(),
                domain: this.orgDomain(),
                timezone: this.orgTimezone(),
                locale: this.orgLocale(),
            },
            schools: {
                mode: this.schoolMode(),
                rows: this.schoolRows(),
            },
            edition: {
                id: this.selectedEditionId(),
                name: this.selectedEditionName(),
            },
            admin: {
                createExtraAdmin: this.createExtraAdmin(),
                name: this.adminName(),
                email: this.adminEmail(),
            }
        };
        this.onboardingStore.save(tenantId, snapshot);
    }

    private schedulePersist(): void {
        if (this.persistTimer) {
            window.clearTimeout(this.persistTimer);
        }
        this.persistTimer = window.setTimeout(() => this.persistState(), 300);
    }

    private defaultTimeZone(): string {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        } catch {
            return '';
        }
    }
}
