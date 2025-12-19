import { FeatureDefinition } from './feature-definition';
import { FeatureValueType } from './feature-value-type';
import { FeatureScope } from './feature-scope';
import { FeatureCatalogValidator } from './feature-catalog.validator';
import { UnknownFeatureKeyException } from '../exceptions/unknown-feature-key.exception';

export class FeatureCatalog {
    static readonly ALL_FEATURES: readonly FeatureDefinition[] = buildFeatureDefinitions();
    private static readonly FEATURE_MAP: Map<string, FeatureDefinition> = buildFeatureMap(FeatureCatalog.ALL_FEATURES);

    static get(key: string): FeatureDefinition {
        const def = this.FEATURE_MAP.get(key.toLowerCase());
        if (!def) {
            throw new UnknownFeatureKeyException(key);
        }
        return def;
    }

    static tryGet(key: string): FeatureDefinition | undefined {
        return this.FEATURE_MAP.get(key.toLowerCase());
    }

    static listByCategory(category: string): FeatureDefinition[] {
        return FeatureCatalog.ALL_FEATURES.filter((f) => f.category === category);
    }

    static listChildren(parentKey: string): FeatureDefinition[] {
        const key = parentKey.toLowerCase();
        return FeatureCatalog.ALL_FEATURES.filter((f) => f.parentKey?.toLowerCase() === key);
    }

    static getAncestors(key: string): FeatureDefinition[] {
        const ancestors: FeatureDefinition[] = [];
        let current = FeatureCatalog.tryGet(key);
        while (current?.parentKey) {
            const parent = FeatureCatalog.tryGet(current.parentKey);
            if (!parent) break;
            ancestors.push(parent);
            current = parent;
        }
        return ancestors;
    }

    static getRootFeatures(): FeatureDefinition[] {
        return FeatureCatalog.ALL_FEATURES.filter((f) => !f.parentKey);
    }

    static toClientDefinitions(scope: FeatureScope, viewer: 'host' | 'tenant'): FeatureDefinition[] {
        return FeatureCatalog.ALL_FEATURES.filter((f) => {
            if (f.scope !== scope) return false;
            if (viewer === 'host') return f.isVisibleToHostAdmin;
            return f.isVisibleToTenantAdmin;
        });
    }
}

function buildFeatureDefinitions(): FeatureDefinition[] {
    const defs: FeatureDefinition[] = [
        // Module toggles
        FeatureDefinition.create({
            key: 'modules.attendance.enabled',
            displayName: 'Attendance',
            category: 'Modules',
            valueType: FeatureValueType.BOOLEAN,
            defaultValue: 'true',
            scope: FeatureScope.TENANT,
            moduleKey: 'attendance',
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),
        FeatureDefinition.create({
            key: 'modules.fees.enabled',
            displayName: 'Fees',
            category: 'Modules',
            valueType: FeatureValueType.BOOLEAN,
            defaultValue: 'false',
            scope: FeatureScope.TENANT,
            moduleKey: 'fees',
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),
        FeatureDefinition.create({
            key: 'modules.students.enabled',
            displayName: 'Students',
            category: 'Modules',
            valueType: FeatureValueType.BOOLEAN,
            defaultValue: 'true',
            scope: FeatureScope.TENANT,
            moduleKey: 'students',
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),
        FeatureDefinition.create({
            key: 'modules.staff.enabled',
            displayName: 'Staff',
            category: 'Modules',
            valueType: FeatureValueType.BOOLEAN,
            defaultValue: 'false',
            scope: FeatureScope.TENANT,
            moduleKey: 'staff',
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),
        FeatureDefinition.create({
            key: 'modules.timetable.enabled',
            displayName: 'Timetable',
            category: 'Modules',
            valueType: FeatureValueType.BOOLEAN,
            defaultValue: 'false',
            scope: FeatureScope.TENANT,
            moduleKey: 'timetable',
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),
        FeatureDefinition.create({
            key: 'modules.exams.enabled',
            displayName: 'Exams',
            category: 'Modules',
            valueType: FeatureValueType.BOOLEAN,
            defaultValue: 'false',
            scope: FeatureScope.TENANT,
            moduleKey: 'exams',
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),
        FeatureDefinition.create({
            key: 'modules.grading.enabled',
            displayName: 'Grading',
            category: 'Modules',
            valueType: FeatureValueType.BOOLEAN,
            defaultValue: 'false',
            scope: FeatureScope.TENANT,
            moduleKey: 'grading',
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),
        FeatureDefinition.create({
            key: 'modules.communication.enabled',
            displayName: 'Communication',
            category: 'Modules',
            valueType: FeatureValueType.BOOLEAN,
            defaultValue: 'false',
            scope: FeatureScope.TENANT,
            moduleKey: 'communication',
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),
        FeatureDefinition.create({
            key: 'modules.calendar.enabled',
            displayName: 'Calendar',
            category: 'Modules',
            valueType: FeatureValueType.BOOLEAN,
            defaultValue: 'false',
            scope: FeatureScope.TENANT,
            moduleKey: 'calendar',
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),

        // Academic hierarchy
        FeatureDefinition.create({
            key: 'modules.academics.enabled',
            displayName: 'Academics',
            category: 'Modules',
            valueType: FeatureValueType.BOOLEAN,
            defaultValue: 'false',
            scope: FeatureScope.TENANT,
            moduleKey: 'academics',
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),
        FeatureDefinition.create({
            key: 'modules.academics.assignments.enabled',
            displayName: 'Assignments',
            category: 'Modules',
            valueType: FeatureValueType.BOOLEAN,
            defaultValue: 'false',
            scope: FeatureScope.TENANT,
            parentKey: 'modules.academics.enabled',
            moduleKey: 'academics',
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),
        FeatureDefinition.create({
            key: 'modules.academics.quizzes.enabled',
            displayName: 'Quizzes',
            category: 'Modules',
            valueType: FeatureValueType.BOOLEAN,
            defaultValue: 'false',
            scope: FeatureScope.TENANT,
            parentKey: 'modules.academics.enabled',
            moduleKey: 'academics',
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),

        // Limits
        FeatureDefinition.create({
            key: 'limits.students.max',
            displayName: 'Max Students',
            category: 'Limits',
            valueType: FeatureValueType.INT,
            defaultValue: '500',
            scope: FeatureScope.TENANT,
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),
        FeatureDefinition.create({
            key: 'limits.staff.max',
            displayName: 'Max Staff',
            category: 'Limits',
            valueType: FeatureValueType.INT,
            defaultValue: '100',
            scope: FeatureScope.TENANT,
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),
        FeatureDefinition.create({
            key: 'limits.parents.max',
            displayName: 'Max Parents',
            category: 'Limits',
            valueType: FeatureValueType.INT,
            defaultValue: '1000',
            scope: FeatureScope.TENANT,
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),
        FeatureDefinition.create({
            key: 'limits.storage.gb',
            displayName: 'Storage (GB)',
            category: 'Limits',
            valueType: FeatureValueType.DECIMAL,
            defaultValue: '10',
            scope: FeatureScope.TENANT,
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),

        // Subscription flags
        FeatureDefinition.create({
            key: 'subscription.allowOverage',
            displayName: 'Allow Overage',
            category: 'Subscription',
            valueType: FeatureValueType.BOOLEAN,
            defaultValue: 'false',
            scope: FeatureScope.TENANT,
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),
        FeatureDefinition.create({
            key: 'subscription.gracePeriodDays',
            displayName: 'Grace Period (Days)',
            category: 'Subscription',
            valueType: FeatureValueType.INT,
            defaultValue: '7',
            scope: FeatureScope.TENANT,
            isVisibleToTenantAdmin: true,
            isVisibleToHostAdmin: true,
        }),
    ];

    FeatureCatalogValidator.validate(defs);
    return defs;
}

function buildFeatureMap(defs: readonly FeatureDefinition[]): Map<string, FeatureDefinition> {
    const map = new Map<string, FeatureDefinition>();
    for (const def of defs) {
        map.set(def.key.toLowerCase(), def);
    }
    return map;
}
