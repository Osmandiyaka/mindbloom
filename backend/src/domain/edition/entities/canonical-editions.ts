import {
    CANONICAL_EDITIONS as ENTITLEMENT_EDITIONS,
    getCanonicalEditionByCode as getEntitlementEditionByCode,
    listCanonicalEditions as listEntitlementEditions,
} from '../../entitlements/entitlements.registry';

export interface CanonicalEdition {
    code: string;
    displayName: string;
    description?: string | null;
    /**
     * Entitlement feature keys for backend enforcement.
     */
    features: string[];
    /**
     * Marketing highlights used in the public editions listing.
     */
    marketingHighlights: string[];
    modules: string[];
    isActive: boolean;
    sortOrder: number;
    monthlyPrice?: number | null;
    annualPrice?: number | null;
    perStudentMonthly?: number | null;
    annualPriceNotes?: string | null;
}

export const CANONICAL_EDITIONS: CanonicalEdition[] = ENTITLEMENT_EDITIONS.map((edition) => ({
    code: edition.code,
    displayName: edition.displayName,
    description: edition.description,
    features: edition.features,
    marketingHighlights: edition.marketingHighlights,
    modules: edition.modules,
    isActive: edition.isActive,
    sortOrder: edition.sortOrder,
    monthlyPrice: edition.pricing?.monthlyPrice ?? null,
    annualPrice: edition.pricing?.annualPrice ?? null,
    perStudentMonthly: edition.pricing?.perStudentMonthly ?? null,
    annualPriceNotes: edition.pricing?.annualPriceNotes ?? null,
}));

export function listCanonicalEditions(): CanonicalEdition[] {
    return listEntitlementEditions().map((edition) => ({
        code: edition.code,
        displayName: edition.displayName,
        description: edition.description,
        features: edition.features,
        marketingHighlights: edition.marketingHighlights,
        modules: edition.modules,
        isActive: edition.isActive,
        sortOrder: edition.sortOrder,
        monthlyPrice: edition.pricing?.monthlyPrice ?? null,
        annualPrice: edition.pricing?.annualPrice ?? null,
        perStudentMonthly: edition.pricing?.perStudentMonthly ?? null,
        annualPriceNotes: edition.pricing?.annualPriceNotes ?? null,
    }));
}

export function getCanonicalEditionByCode(code: string): CanonicalEdition | null {
    const edition = getEntitlementEditionByCode(code);
    if (!edition) return null;
    return {
        code: edition.code,
        displayName: edition.displayName,
        description: edition.description,
        features: edition.features,
        marketingHighlights: edition.marketingHighlights,
        modules: edition.modules,
        isActive: edition.isActive,
        sortOrder: edition.sortOrder,
        monthlyPrice: edition.pricing?.monthlyPrice ?? null,
        annualPrice: edition.pricing?.annualPrice ?? null,
        perStudentMonthly: edition.pricing?.perStudentMonthly ?? null,
        annualPriceNotes: edition.pricing?.annualPriceNotes ?? null,
    };
}
