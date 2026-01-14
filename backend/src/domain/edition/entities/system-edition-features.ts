import { EditionFeatureAssignment } from '../../ports/out/edition-repository.port';

/**
 * Canonical edition feature assignments seeded at startup.
 * Keep in sync with scripts/seed-editions.js
 */
export function createGlobalEditionFeatureAssignments(): Record<string, EditionFeatureAssignment[]> {
    return {
        free: [
            { featureKey: 'students', value: 'true' },
            { featureKey: 'attendance', value: 'true' },
            { featureKey: 'basic_reporting', value: 'true' },
            { featureKey: 'setup_tools', value: 'true' },
            { featureKey: 'support_level', value: 'community' },
        ],
        professional: [
            { featureKey: 'grading_models', value: 'true' },
            { featureKey: 'advanced_reporting', value: 'true' },
            { featureKey: 'bulk_imports', value: 'true' },
            { featureKey: 'library', value: 'true' },
            { featureKey: 'fees', value: 'true' },
            { featureKey: 'support_level', value: 'priority' },
        ],
        premium: [
            { featureKey: 'multi_school', value: 'true' },
            { featureKey: 'rbac', value: 'true' },
            { featureKey: 'timetables', value: 'true' },
            { featureKey: 'finance', value: 'true' },
            { featureKey: 'transport', value: 'true' },
            { featureKey: 'support_level', value: 'phone' },
        ],
        enterprise: [
            { featureKey: 'sso', value: 'true' },
            { featureKey: 'audit_logs', value: 'true' },
            { featureKey: 'custom_roles', value: 'true' },
            { featureKey: 'unlimited_storage', value: 'true' },
            { featureKey: '24_7_support', value: 'true' },
            { featureKey: 'support_level', value: '24_7' },
        ],
    };
}
