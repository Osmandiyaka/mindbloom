/**
 * Tenant domain models for context resolution.
 * Captures tenant identity, branding, and resolution source.
 */

export interface TenantBranding {
    logoUrl?: string;
    primaryColor?: string;
    accentColor?: string;
    portalName?: string;
}

export type TenantResolutionStatus = 'idle' | 'resolving' | 'ready' | 'not-found' | 'error';

export interface TenantContext {
    tenantId: string;
    tenantSlug: string;      // e.g. "st-marys"
    tenantName: string;      // e.g. "St Mary's School"
    branding?: TenantBranding;
    resolvedFrom: 'subdomain' | 'path' | 'jwt';
}
