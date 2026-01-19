export const normalizeName = (value: string): string => value.trim().toLowerCase();

export const normalizeOptionalText = (value?: string | null): string | undefined => {
    if (value === undefined || value === null) return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
};

export const uniqueSorted = (values: string[]): string[] => {
    const cleaned = values.map(v => v.trim()).filter(Boolean);
    return Array.from(new Set(cleaned)).sort();
};

export const scopeKeyForSchoolIds = (tenantId: string, schoolIds: string[]): string => {
    const ids = uniqueSorted(schoolIds);
    return `${tenantId}:${ids.join('-')}`;
};

export const hasOverlap = (a: string[], b: string[]): boolean => {
    const set = new Set(a);
    return b.some(id => set.has(id));
};

export const requireConfirmation = (name: string, confirmationText?: string): boolean => {
    if (!confirmationText) return false;
    return confirmationText.trim().toLowerCase() === name.trim().toLowerCase();
};
