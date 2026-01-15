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
type StatusType = 'enabled' | 'locked' | 'disabled';

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
    bulkReason = '';
    bulkEmail = '';
    bulkUrgency: 'normal' | 'urgent' = 'normal';

    currentPlanId = signal<SubscriptionPlan>('free');
    currentPlanName = signal('Free');
    entitlements = signal(this.entitlementsService.currentEntitlements());

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
            const status = this.moduleStatus(module.key, config.access);
            const change = this.compareMode() && !this.isViewingCurrent()
                ? this.compareAccess(config.access, currentConfig.access)
                : null;
            return {
                ...module,
                access: config.access,
                status,
                notes: config.notes || this.statusNote(module.key, config.access, status),
                change,
            };
        });
    });

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
        this.compareMode.set(false);
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
            case 'disabled':
                return 'Disabled';
            default:
                return 'Locked';
        }
    }

    moduleStatus(moduleKey: ModuleKey, access: AccessType): StatusType {
        if (!this.isViewingCurrent()) {
            return access === 'included' ? 'locked' : 'locked';
        }
        if (access === 'included') {
            const entitlements = this.entitlements();
            if (!entitlements?.modules) {
                return 'enabled';
            }
            return entitlements.modules[moduleKey] ? 'enabled' : 'disabled';
        }
        return 'locked';
    }

    statusNote(moduleKey: ModuleKey, access: AccessType, status: StatusType): string | undefined {
        if (status === 'disabled') {
            return 'Disabled by admin override';
        }
        if (!this.isViewingCurrent() && access === 'included') {
            return 'Switch to this plan to enable';
        }
        if (access === 'add_on') {
            return 'Contact sales to enable';
        }
        if (access === 'not_included') {
            return 'Not included in this edition';
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

    toggleCompare(): void {
        this.compareMode.set(!this.compareMode());
    }

    openRequestModal(): void {
        this.showRequestModal.set(true);
    }

    closeRequestModal(): void {
        this.showRequestModal.set(false);
    }

    submitRequest(): void {
        this.showRequestModal.set(false);
    }

    openOverridesDrawer(): void {
        this.showOverridesDrawer.set(true);
    }

    closeOverridesDrawer(): void {
        this.showOverridesDrawer.set(false);
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
    },
    {
        key: 'academics',
        name: MODULE_NAMES.academics,
        description: 'Classes, curricula, grading, and academic setup.',
        icon: 'book-open',
        features: ['Class setup', 'Subjects', 'Grading policies'],
    },
    {
        key: 'fees',
        name: MODULE_NAMES.fees,
        description: 'Tuition plans, invoicing, and payment tracking.',
        icon: 'banknote',
        features: ['Fee plans', 'Invoicing', 'Payment tracking'],
    },
    {
        key: 'accounting',
        name: MODULE_NAMES.accounting,
        description: 'Accounting ledgers and reconciliation.',
        icon: 'calculator',
        features: ['Journals', 'Chart of accounts', 'Reconciliation'],
    },
    {
        key: 'hr',
        name: MODULE_NAMES.hr,
        description: 'Staff records, onboarding, and HR workflows.',
        icon: 'briefcase',
        features: ['Staff profiles', 'Contracts', 'Leave tracking'],
    },
    {
        key: 'library',
        name: MODULE_NAMES.library,
        description: 'Library catalog and lending workflows.',
        icon: 'book',
        features: ['Catalog', 'Lending', 'Fines'],
    },
    {
        key: 'transport',
        name: MODULE_NAMES.transport,
        description: 'Routes, vehicles, and transport management.',
        icon: 'bus',
        features: ['Routes', 'Vehicles', 'Driver assignments'],
    },
    {
        key: 'roles',
        name: MODULE_NAMES.roles,
        description: 'Roles, permissions, and access governance.',
        icon: 'shield',
        features: ['Role management', 'Permission trees', 'Audit trails'],
    },
    {
        key: 'dashboard',
        name: 'Reports & Analytics',
        description: 'Reporting dashboards and exports.',
        icon: 'bar-chart',
        features: ['Dashboards', 'Exports', 'Usage insights'],
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
