import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SubscriptionPlan, SubscriptionService } from '../../../../core/services/subscription.service';
import { EditionService } from '../../../../shared/services/entitlements.service';
import { MODULE_NAMES, ModuleKey } from '../../../../shared/types/module-keys';
import { UiButtonComponent } from '../../../../shared/ui/buttons/ui-button.component';
import { UiCheckboxComponent } from '../../../../shared/ui/forms/ui-checkbox.component';
import { UiInputComponent } from '../../../../shared/ui/forms/ui-input.component';

type AccessType = 'included' | 'not_included' | 'add_on';
type StatusType = 'enabled' | 'locked_plan' | 'disabled_override' | 'not_configured';

interface EditionModuleConfig {
    access: AccessType;
    notes?: string;
}

interface EditionPlan {
    id: SubscriptionPlan;
    name: string;
    tagline: string;
    priceLabel: string;
    description: string;
    highlights: string[];
    limits: Array<{ label: string; value: string }>;
    modules: Partial<Record<ModuleKey, EditionModuleConfig>>;
    requiresSales?: boolean;
    recommended?: boolean;
}

interface ModuleDefinition {
    key: ModuleKey;
    name: string;
    description: string;
    icon: string;
    features: string[];
    permissions: string[];
}

interface ComparePlanCell {
    planId: SubscriptionPlan;
    included: boolean;
    label: string;
}

interface ComparePlanRow {
    key: ModuleKey;
    name: string;
    cells: ComparePlanCell[];
}

type OverrideFilter = 'all' | 'enabled' | 'disabled' | 'limits' | 'security';
type OverrideType = 'enabled' | 'disabled' | 'limit' | 'security';

interface EntitlementOverride {
    module: string;
    overrideType: OverrideType;
    previous?: string;
    value: string;
    reason: string;
    updatedBy: string;
    updatedAt: string;
}

interface SummaryCard {
    label: string;
    value: string;
    subtext: string;
    warning: boolean;
}

@Component({
    selector: 'app-plan-entitlements',
    standalone: true,
    imports: [CommonModule, FormsModule, UiButtonComponent, UiCheckboxComponent, UiInputComponent],
    templateUrl: './plan-entitlements.component.html',
    styleUrls: ['./plan-entitlements.component.scss'],
})
export class PlanEntitlementsComponent implements OnInit {
    private readonly subscriptionService = inject(SubscriptionService);
    private readonly entitlementsService = inject(EditionService);

    loading = signal(true);
    error = signal<string | null>(null);
    activeTab = signal<'modules' | 'limits'>('modules');
    compareMode = signal(false);
    selectedEditionId = signal<SubscriptionPlan | null>(null);
    drawerModuleKey = signal<ModuleKey | null>(null);
    showRequestModal = signal(false);
    showOverridesDrawer = signal(false);
    showCompareModal = signal(false);
    activeLockInfo = signal<ModuleKey | null>(null);
    overflowOpen = signal(false);
    overrideFilter = signal<OverrideFilter>('all');
    downgradeConfirmText = '';
    bulkReason = '';
    bulkEmail = '';
    bulkUrgency: 'normal' | 'urgent' = 'normal';

    currentPlanId = signal<SubscriptionPlan>('free');
    currentPlanName = signal('Free');
    billingLabel = signal('Monthly');
    entitlements = signal(this.entitlementsService.currentEntitlements());
    entitlementsLastSynced = signal('Jan 15, 2026');
    entitlementsSource = signal('Backend');

    editions = signal<EditionPlan[]>(DEFAULT_EDITIONS);
    moduleCatalog = signal<ModuleDefinition[]>(DEFAULT_MODULES);

    currentEdition = computed(() => this.editions().find((edition) => edition.id === this.currentPlanId()) || null);
    selectedEdition = computed(() => {
        const selectedId = this.selectedEditionId() || this.currentPlanId();
        return this.editions().find((edition) => edition.id === selectedId) || null;
    });
    isViewingCurrent = computed(() => this.selectedEdition()?.id === this.currentPlanId());

    moduleRows = computed(() => {
        const edition = this.selectedEdition();
        const currentEdition = this.currentEdition();
        const currentModules = currentEdition?.modules || {};
        if (!edition) {
            return [];
        }
        return this.moduleCatalog().map((module) => {
            const config = edition.modules[module.key] || { access: 'not_included' as AccessType };
            const currentConfig = currentModules[module.key] || { access: 'not_included' as AccessType };
            const status = this.moduleStatus(module.key, currentConfig.access || 'not_included');
            const change = this.compareMode() && !this.isViewingCurrent()
                ? this.compareAccess(config.access, currentConfig.access)
                : null;
            return {
                ...module,
                access: config.access,
                status,
                notes: config.notes || this.statusNote(module.key, config.access, status),
                change,
                isAdded: change === '+ Added',
                isUnchanged: change === 'No change',
                needsSetup: status === 'not_configured',
                lockReason: this.lockReason(module.key, config.access, status),
            };
        });
    });

    compareBanner = computed(() => {
        if (!this.compareMode() || this.isViewingCurrent()) {
            return null;
        }
        const current = this.currentEdition();
        const selected = this.selectedEdition();
        if (!current || !selected) {
            return null;
        }
        return {
            title: `Comparing ${current.name} \u2192 ${selected.name}`,
            summary: this.compareSummary(current, selected),
        };
    });

    usageSnapshot = signal({
        users: 28,
        schools: 2,
        storageGb: 120,
    });

    summaryCards = computed<SummaryCard[]>(() => {
        const edition = this.selectedEdition();
        if (!edition) {
            return [];
        }
        const users = this.limitValue(edition, 'Users') || '—';
        const schools = this.limitValue(edition, 'Schools') || '—';
        const storage = this.limitValue(edition, 'Storage') || '—';
        const support = this.limitValue(edition, 'Support') || '—';
        return [
            this.buildSummaryCard('Schools', schools, 'per tenant', this.usageSnapshot().schools),
            this.buildSummaryCard('Users', users, 'per tenant', this.usageSnapshot().users),
            this.buildSummaryCard('Storage', storage, 'soft limit', this.usageSnapshot().storageGb),
            { label: 'Support', value: support, subtext: 'support tier', warning: false },
        ];
    });

    compareDiffs = computed(() => {
        if (!this.compareMode() || this.isViewingCurrent()) {
            return [];
        }
        const current = this.currentEdition();
        const selected = this.selectedEdition();
        if (!current || !selected) {
            return [];
        }
        const diff = (label: string) => ({
            label,
            current: this.limitValue(current, label) || '—',
            selected: this.limitValue(selected, label) || '—',
        });
        return [
            diff('Users'),
            diff('Schools'),
            diff('Storage'),
            diff('Support'),
        ];
    });

    comparePlanRows = computed<ComparePlanRow[]>(() => {
        const editions = this.editions();
        return this.moduleCatalog().map((module) => {
            const cells = editions.map((edition) => {
                const access = edition.modules?.[module.key]?.access || 'not_included';
                return {
                    planId: edition.id,
                    included: access === 'included',
                    label: access === 'included' ? 'Included' : access === 'add_on' ? 'Add-on' : '—',
                };
            });
            return {
                key: module.key,
                name: module.name,
                cells,
            };
        });
    });

    isDowngrade = computed(() => {
        const selected = this.selectedEdition()?.id;
        const current = this.currentPlanId();
        if (!selected) {
            return false;
        }
        return this.isLowerPlan(selected, current);
    });

    downgradeImpacts = computed(() => {
        const current = this.currentEdition();
        const selected = this.selectedEdition();
        if (!current || !selected) {
            return [];
        }
        const currentIncluded = Object.entries(current.modules || {})
            .filter(([, config]) => config?.access === 'included')
            .map(([key]) => key);
        const selectedIncluded = Object.entries(selected.modules || {})
            .filter(([, config]) => config?.access === 'included')
            .map(([key]) => key);
        const removed = currentIncluded.filter((key) => !selectedIncluded.includes(key as ModuleKey));
        return removed.map((key) => MODULE_NAMES[key as ModuleKey] || key);
    });

    overrides = signal<EntitlementOverride[]>(DEFAULT_OVERRIDES);

    overrideCount = computed(() => this.overrides().length);

    filteredOverrides = computed(() => {
        const filter = this.overrideFilter();
        if (filter === 'all') {
            return this.overrides();
        }
        return this.overrides().filter((override) => {
            switch (filter) {
                case 'enabled':
                    return override.overrideType === 'enabled';
                case 'disabled':
                    return override.overrideType === 'disabled';
                case 'limits':
                    return override.overrideType === 'limit';
                case 'security':
                    return override.overrideType === 'security';
                default:
                    return true;
            }
        });
    });

    setOverrideFilter(filter: OverrideFilter): void {
        this.overrideFilter.set(filter);
    }

    toggleOverflow(): void {
        this.overflowOpen.set(!this.overflowOpen());
    }

    closeOverflow(): void {
        this.overflowOpen.set(false);
    }

    planRank(plan: SubscriptionPlan | null | undefined): number {
        const order: Record<SubscriptionPlan, number> = {
            free: 0,
            basic: 1,
            premium: 2,
            enterprise: 3,
        };
        if (!plan) {
            return -1;
        }
        return order[plan];
    }

    isHigherPlan(selected: SubscriptionPlan, current: SubscriptionPlan): boolean {
        return this.planRank(selected) > this.planRank(current);
    }

    isLowerPlan(selected: SubscriptionPlan, current: SubscriptionPlan): boolean {
        return this.planRank(selected) < this.planRank(current);
    }

    primaryCtaLabel(): string {
        const selected = this.selectedEdition()?.id;
        const current = this.currentPlanId();
        if (!selected) {
            return 'Select a plan';
        }
        if (selected === current) {
            return 'Current plan';
        }
        if (selected === 'enterprise') {
            return 'Contact sales';
        }
        if (this.isLowerPlan(selected, current)) {
            return 'Downgrade request';
        }
        return `Upgrade to ${this.selectedEdition()?.name || ''}`.trim();
    }
    ngOnInit(): void {
        this.reload();
    }

    reload(): void {
        forkJoin({
            subscription: this.subscriptionService.getCurrent().pipe(catchError(() => of(null))),
            entitlements: this.entitlementsService.loadEntitlements().pipe(catchError(() => of(null))),
        }).subscribe(({ subscription, entitlements }) => {
            if (subscription?.plan) {
                this.currentPlanId.set(subscription.plan);
                this.currentPlanName.set(this.titleCase(subscription.plan));
            }
            if (entitlements) {
                this.entitlements.set(entitlements);
                if (entitlements.edition?.code) {
                    this.currentPlanId.set(entitlements.edition.code as SubscriptionPlan);
                    this.currentPlanName.set(entitlements.edition.displayName);
                }
            }
            if (!this.selectedEditionId()) {
                this.selectedEditionId.set(this.currentPlanId());
            }
            this.loading.set(false);
        }, () => {
            this.error.set('Unable to load plan data. Please try again.');
            this.loading.set(false);
        });
    }

    selectEdition(edition: EditionPlan): void {
        this.selectedEditionId.set(edition.id);
        this.drawerModuleKey.set(null);
    }

    isSelected(edition: EditionPlan): boolean {
        return this.selectedEdition()?.id === edition.id;
    }

    editionStatus(edition: EditionPlan): 'current' | 'available' | 'requires_sales' {
        if (edition.id === this.currentPlanId()) {
            return 'current';
        }
        if (edition.requiresSales) {
            return 'requires_sales';
        }
        return 'available';
    }

    accessLabel(access: AccessType): string {
        switch (access) {
            case 'included':
                return 'Included';
            case 'add_on':
                return 'Add-on';
            default:
                return 'Not included';
        }
    }

    statusLabel(status: StatusType): string {
        switch (status) {
            case 'enabled':
                return 'Enabled';
            case 'disabled_override':
                return 'Disabled';
            case 'not_configured':
                return 'Needs setup';
            default:
                return 'Locked (plan)';
        }
    }

    moduleStatus(moduleKey: ModuleKey, access: AccessType): StatusType {
        if (access === 'included') {
            const entitlements = this.entitlements();
            if (!entitlements?.modules) {
                return this.requiresConfiguration(moduleKey) ? 'not_configured' : 'enabled';
            }
            return entitlements.modules[moduleKey]
                ? (this.requiresConfiguration(moduleKey) ? 'not_configured' : 'enabled')
                : 'disabled_override';
        }
        return 'locked_plan';
    }

    statusNote(moduleKey: ModuleKey, access: AccessType, status: StatusType): string | undefined {
        if (status === 'disabled_override') {
            return 'Disabled by admin override';
        }
        if (status === 'not_configured') {
            return 'Setup required';
        }
        if (!this.isViewingCurrent() && access === 'included') {
            const required = this.minimumPlanForModule(moduleKey);
            return required ? `Requires ${required} or higher` : 'Requires higher plan';
        }
        if (access === 'add_on') {
            return 'Add-on available';
        }
        if (access === 'not_included') {
            const required = this.minimumPlanForModule(moduleKey);
            return required ? `Requires ${required} or higher` : 'Requires higher plan';
        }
        return undefined;
    }

    compareAccess(target: AccessType, current: AccessType): string {
        if (target === current) {
            return 'No change';
        }
        if (target === 'included' && current !== 'included') {
            return '+ Added';
        }
        if (target !== 'included' && current === 'included') {
            return '– Removed';
        }
        return 'Changed';
    }

    requiresConfiguration(moduleKey: ModuleKey): boolean {
        const requires = new Set<ModuleKey>([
            'fees',
            'accounting',
            'library',
            'transport',
            'hr',
            'payroll',
        ]);
        return requires.has(moduleKey);
    }

    lockReason(moduleKey: ModuleKey, access: AccessType, status: StatusType): string | null {
        if (status === 'disabled_override') {
            return 'This module is disabled by an admin override.';
        }
        if (status === 'not_configured') {
            return 'Complete setup to enable this module for the tenant.';
        }
        if (status === 'locked_plan' && access === 'included' && !this.isViewingCurrent()) {
            const required = this.minimumPlanForModule(moduleKey);
            return required ? `Requires ${required} or higher.` : 'Requires a higher plan.';
        }
        if (access === 'add_on') {
            return 'This module is available as an add-on. Contact sales to enable.';
        }
        if (access === 'not_included') {
            const required = this.minimumPlanForModule(moduleKey);
            if (required) {
                return `This module requires ${required} or higher.`;
            }
            return 'This module is not included in the selected edition.';
        }
        return null;
    }

    minimumPlanForModule(moduleKey: ModuleKey): string | null {
        const order: SubscriptionPlan[] = ['free', 'basic', 'premium', 'enterprise'];
        for (const plan of order) {
            const edition = this.editions().find((item) => item.id === plan);
            if (edition?.modules?.[moduleKey]?.access === 'included') {
                return edition.name;
            }
        }
        return null;
    }

    toggleLockInfo(moduleKey: ModuleKey, event: Event): void {
        event.stopPropagation();
        this.activeLockInfo.set(this.activeLockInfo() === moduleKey ? null : moduleKey);
    }

    compareSummary(current: EditionPlan, selected: EditionPlan): string[] {
        const currentModules = Object.entries(current.modules || {})
            .filter(([, config]) => config?.access === 'included')
            .map(([key]) => key);
        const selectedModules = Object.entries(selected.modules || {})
            .filter(([, config]) => config?.access === 'included')
            .map(([key]) => key);
        const addedCount = selectedModules.filter((key) => !currentModules.includes(key)).length;
        const removedCount = currentModules.filter((key) => !selectedModules.includes(key)).length;
        const items: string[] = [];
        if (addedCount > 0) {
            items.push(`+${addedCount} modules`);
        }
        if (removedCount > 0) {
            items.push(`-${removedCount} modules`);
        }
        const selectedUsers = this.limitValue(selected, 'Users');
        const currentUsers = this.limitValue(current, 'Users');
        if (selectedUsers && selectedUsers !== currentUsers) {
            items.push(`+${selectedUsers.toLowerCase()}`);
        }
        if (selected.id === 'enterprise' && current.id !== 'enterprise') {
            items.push('+SSO');
        }
        return items;
    }

    limitValue(edition: EditionPlan, label: string): string | null {
        return edition.limits.find((limit) => limit.label === label)?.value || null;
    }

    buildSummaryCard(label: string, value: string, subtext: string, usage?: number): SummaryCard {
        const limit = this.parseLimit(value);
        const isOver = typeof usage === 'number' && typeof limit === 'number' && usage > limit;
        const overBy = isOver ? usage - (limit || 0) : 0;
        return {
            label,
            value: isOver ? `${usage} ${label.toLowerCase()} (${overBy} over limit)` : value,
            subtext,
            warning: isOver,
        };
    }

    parseLimit(value: string): number | null {
        if (!value) {
            return null;
        }
        const lowered = value.toLowerCase();
        if (lowered.includes('unlimited') || lowered.includes('custom') || lowered.includes('contact')) {
            return null;
        }
        const match = value.match(/(\d+[\d,]*)/);
        if (!match) {
            return null;
        }
        return Number(match[1].replace(/,/g, ''));
    }

    openModuleDetail(moduleKey: ModuleKey): void {
        this.drawerModuleKey.set(moduleKey);
    }

    closeModuleDetail(): void {
        this.drawerModuleKey.set(null);
    }

    selectedModule(): ModuleDefinition | null {
        const key = this.drawerModuleKey();
        if (!key) {
            return null;
        }
        return this.moduleCatalog().find((module) => module.key === key) || null;
    }

    includedPlans(moduleKey: ModuleKey): string[] {
        return this.editions()
            .filter((edition) => edition.modules?.[moduleKey]?.access === 'included')
            .map((edition) => edition.name);
    }

    currentTenantModuleState(moduleKey: ModuleKey): { label: string; reason: string | null } {
        const current = this.currentEdition();
        const access = current?.modules?.[moduleKey]?.access || 'not_included';
        const status = this.moduleStatus(moduleKey, access);
        return {
            label: this.statusLabel(status),
            reason: this.lockReason(moduleKey, access, status),
        };
    }

    toggleCompare(): void {
        this.compareMode.set(!this.compareMode());
    }

    openRequestModal(): void {
        this.showRequestModal.set(true);
    }

    closeRequestModal(): void {
        this.showRequestModal.set(false);
    }

    openCompareModal(): void {
        this.showCompareModal.set(true);
    }

    closeCompareModal(): void {
        this.showCompareModal.set(false);
    }

    submitRequest(): void {
        this.showRequestModal.set(false);
    }

    downloadPlanSummary(): void {
        this.closeOverflow();
    }

    copyEntitlementSnapshot(): void {
        this.closeOverflow();
    }

    openOverridesDrawer(): void {
        this.showOverridesDrawer.set(true);
    }

    closeOverridesDrawer(): void {
        this.showOverridesDrawer.set(false);
    }

    startSetup(moduleKey: ModuleKey, event: Event): void {
        event.stopPropagation();
        this.openModuleDetail(moduleKey);
    }

    titleCase(value: string): string {
        return value
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }
}

const DEFAULT_MODULES: ModuleDefinition[] = [
    {
        key: 'students',
        name: MODULE_NAMES.students,
        description: 'Student profiles, enrollment, and records.',
        icon: 'users',
        features: ['Student profiles', 'Guardian contacts', 'Enrollment history'],
        permissions: ['Read', 'Create', 'Update', 'Delete'],
    },
    {
        key: 'academics',
        name: MODULE_NAMES.academics,
        description: 'Classes, curricula, grading, and academic setup.',
        icon: 'book-open',
        features: ['Class setup', 'Subjects', 'Grading policies'],
        permissions: ['Read', 'Create', 'Update', 'Delete'],
    },
    {
        key: 'fees',
        name: MODULE_NAMES.fees,
        description: 'Tuition plans, invoicing, and payment tracking.',
        icon: 'banknote',
        features: ['Fee plans', 'Invoicing', 'Payment tracking'],
        permissions: ['Read', 'Create', 'Update', 'Delete'],
    },
    {
        key: 'accounting',
        name: MODULE_NAMES.accounting,
        description: 'Accounting ledgers and reconciliation.',
        icon: 'calculator',
        features: ['Journals', 'Chart of accounts', 'Reconciliation'],
        permissions: ['Read', 'Create', 'Update', 'Delete'],
    },
    {
        key: 'hr',
        name: MODULE_NAMES.hr,
        description: 'Staff records, onboarding, and HR workflows.',
        icon: 'briefcase',
        features: ['Staff profiles', 'Contracts', 'Leave tracking'],
        permissions: ['Read', 'Create', 'Update', 'Delete'],
    },
    {
        key: 'library',
        name: MODULE_NAMES.library,
        description: 'Library catalog and lending workflows.',
        icon: 'book',
        features: ['Catalog', 'Lending', 'Fines'],
        permissions: ['Read', 'Create', 'Update', 'Delete'],
    },
    {
        key: 'transport',
        name: MODULE_NAMES.transport,
        description: 'Routes, vehicles, and transport management.',
        icon: 'bus',
        features: ['Routes', 'Vehicles', 'Driver assignments'],
        permissions: ['Read', 'Create', 'Update', 'Delete'],
    },
    {
        key: 'roles',
        name: MODULE_NAMES.roles,
        description: 'Roles, permissions, and access governance.',
        icon: 'shield',
        features: ['Role management', 'Permission trees', 'Audit trails'],
        permissions: ['Read', 'Create', 'Update', 'Delete'],
    },
    {
        key: 'dashboard',
        name: 'Reports & Analytics',
        description: 'Reporting dashboards and exports.',
        icon: 'bar-chart',
        features: ['Dashboards', 'Exports', 'Usage insights'],
        permissions: ['Read', 'Export'],
    },
];

const DEFAULT_EDITIONS: EditionPlan[] = [
    {
        id: 'free',
        name: 'Free',
        tagline: 'Starter plan for early adoption',
        priceLabel: '$0 / month',
        description: 'Essential modules to run daily school operations.',
        highlights: ['Community support', 'Core student workflows'],
        limits: [
            { label: 'Schools', value: '1 school' },
            { label: 'Users', value: 'Up to 25 users' },
            { label: 'Storage', value: '5 GB' },
            { label: 'Support', value: 'Email support' },
        ],
        modules: {
            students: { access: 'included' },
            academics: { access: 'included' },
            fees: { access: 'not_included' },
            accounting: { access: 'not_included' },
            hr: { access: 'not_included' },
            library: { access: 'not_included' },
            transport: { access: 'not_included' },
            roles: { access: 'included' },
            dashboard: { access: 'not_included' },
        },
    },
    {
        id: 'basic',
        name: 'Professional',
        tagline: 'Operational suite for growing schools',
        priceLabel: '$49 / month',
        description: 'Expanded capabilities with core operational modules.',
        highlights: ['Priority email support', 'Operational analytics'],
        limits: [
            { label: 'Schools', value: 'Up to 5 schools' },
            { label: 'Users', value: 'Up to 150 users' },
            { label: 'Storage', value: '50 GB' },
            { label: 'Support', value: 'Priority support' },
        ],
        modules: {
            students: { access: 'included' },
            academics: { access: 'included' },
            fees: { access: 'included' },
            accounting: { access: 'not_included' },
            hr: { access: 'not_included' },
            library: { access: 'included' },
            transport: { access: 'not_included' },
            roles: { access: 'included' },
            dashboard: { access: 'included' },
        },
    },
    {
        id: 'premium',
        name: 'Premium',
        tagline: 'Advanced operations and compliance',
        priceLabel: '$99 / month',
        description: 'Full operational coverage with compliance tooling.',
        highlights: ['Audit trail', 'Advanced reporting'],
        limits: [
            { label: 'Schools', value: 'Up to 10 schools' },
            { label: 'Users', value: 'Up to 500 users' },
            { label: 'Storage', value: '200 GB' },
            { label: 'Support', value: 'Priority support' },
        ],
        recommended: true,
        modules: {
            students: { access: 'included' },
            academics: { access: 'included' },
            fees: { access: 'included' },
            accounting: { access: 'included' },
            hr: { access: 'included' },
            library: { access: 'included' },
            transport: { access: 'included' },
            roles: { access: 'included' },
            dashboard: { access: 'included' },
        },
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        tagline: 'Custom entitlements and premium support',
        priceLabel: 'Contact sales',
        description: 'Enterprise controls, custom SLAs, and dedicated success.',
        highlights: ['Dedicated CSM', 'Custom SLAs', 'Advanced security'],
        limits: [
            { label: 'Schools', value: 'Unlimited' },
            { label: 'Users', value: 'Unlimited' },
            { label: 'Storage', value: 'Custom' },
            { label: 'Support', value: 'Dedicated support' },
        ],
        requiresSales: true,
        modules: {
            students: { access: 'included' },
            academics: { access: 'included' },
            fees: { access: 'included' },
            accounting: { access: 'included' },
            hr: { access: 'included' },
            library: { access: 'included' },
            transport: { access: 'included' },
            roles: { access: 'included' },
            dashboard: { access: 'included' },
        },
    },
];

const DEFAULT_OVERRIDES: EntitlementOverride[] = [
    {
        module: 'Finance',
        overrideType: 'disabled',
        previous: 'Enabled',
        value: 'Disabled',
        reason: 'Trial expired',
        updatedBy: 'System',
        updatedAt: 'Jan 12, 2026',
    },
    {
        module: 'Users',
        overrideType: 'limit',
        previous: '100 users',
        value: 'Up to 200 users',
        reason: 'Enterprise pilot',
        updatedBy: 'Success Team',
        updatedAt: 'Feb 03, 2026',
    },
    {
        module: 'SSO',
        overrideType: 'security',
        previous: 'Unavailable',
        value: 'Enabled',
        reason: 'Security requirement',
        updatedBy: 'Security Admin',
        updatedAt: 'Feb 10, 2026',
    },
];
