import { EditionFeatureAssignment } from '../../ports/out/edition-repository.port';

/**
 * Canonical edition feature assignments seeded at startup.
 * Keep in sync with scripts/seed-editions.js
 */
export function createGlobalEditionFeatureAssignments(): Record<string, EditionFeatureAssignment[]> {
    return {
        starter: [
            { featureKey: 'students', value: 'true' },
            { featureKey: 'attendance', value: 'true' },
            { featureKey: 'grades', value: 'true' },
            { featureKey: 'reports', value: 'true' },
            { featureKey: 'email_support', value: 'true' },
            { featureKey: 'branding', value: 'true' },
            { featureKey: 'support_level', value: 'email' },
        ],
        professional: [
            { featureKey: 'timetabling', value: 'true' },
            { featureKey: 'parent_portal', value: 'true' },
            { featureKey: 'library', value: 'true' },
            { featureKey: 'hostel', value: 'true' },
            { featureKey: 'sms', value: 'true' },
            { featureKey: 'priority_support', value: 'true' },
            { featureKey: 'api_access', value: 'true' },
            { featureKey: 'support_level', value: 'priority' },
        ],
        premium: [
            { featureKey: 'transport', value: 'true' },
            { featureKey: 'exams', value: 'true' },
            { featureKey: 'payroll', value: 'true' },
            { featureKey: 'analytics', value: 'true' },
            { featureKey: 'workflows', value: 'true' },
            { featureKey: 'phone_support', value: 'true' },
            { featureKey: 'custom_domains', value: 'true' },
            { featureKey: 'support_level', value: 'phone' },
        ],
        enterprise: [
            { featureKey: 'dedicated_db', value: 'true' },
            { featureKey: 'sso', value: 'true' },
            { featureKey: 'custom_modules', value: 'true' },
            { featureKey: 'on_prem', value: 'true' },
            { featureKey: '24_7_support', value: 'true' },
            { featureKey: 'white_label', value: 'true' },
            { featureKey: 'support_level', value: '24_7' },
        ],
    };
}
