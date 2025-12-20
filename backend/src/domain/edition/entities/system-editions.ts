import { Edition } from './edition.entity';

/**
 * Canonical platform editions seeded at startup.
 * Keep in sync with scripts/seed-editions.js
 */
export function createGlobalEditions(): Edition[] {
    return [
        Edition.create({
            id: `starter-edition`,
            name: 'starter',
            displayName: 'Starter',
            description: 'Basic features for small schools',
            monthlyPrice: 29,
            annualPrice: 278,
            perStudentMonthly: null,
            annualPriceNotes: null,
            isActive: true,
            sortOrder: 10,
        }),
        Edition.create({
            id: `professional-edition`,
            name: 'professional',
            displayName: 'Professional',
            description: 'Expanded features for growing schools',
            monthlyPrice: 99,
            annualPrice: 950,
            perStudentMonthly: null,
            annualPriceNotes: null,
            isActive: true,
            sortOrder: 20,
        }),
        Edition.create({
            id: `premium-edition`,
            name: 'premium',
            displayName: 'Premium',
            description: 'Advanced features for larger schools',
            monthlyPrice: 299,
            annualPrice: 2870,
            perStudentMonthly: null,
            annualPriceNotes: null,
            isActive: true,
            sortOrder: 30,
        }),
        Edition.create({
            id: `enterprise-edition`,
            name: 'enterprise',
            displayName: 'Enterprise',
            description: 'Full enterprise-grade features and support',
            monthlyPrice: 599,
            annualPrice: null,
            perStudentMonthly: 2,
            annualPriceNotes: 'Custom',
            isActive: true,
            sortOrder: 40,
        }),
    ];
}
