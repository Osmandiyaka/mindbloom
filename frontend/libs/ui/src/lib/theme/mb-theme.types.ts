export type MbThemeMode = 'light' | 'dark' | 'auto';
export type MbDensityMode = 'comfortable' | 'compact';

export interface MbThemeDefinition {
    id: string;
    name: string;
    mode: 'light' | 'dark';
}

export interface MbTenantBranding {
    tenantId: string;
    primary: string;
    logoUrl?: string;
}

export interface MbThemeState {
    theme: MbThemeDefinition;
    mode: MbThemeMode;
    density: MbDensityMode;
    tenant?: MbTenantBranding;
}
