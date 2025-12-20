export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL';

export interface TenantListItem {
    id: string;
    name: string;
    subdomain: string;
    editionId?: string | null;
    editionName?: string | null;
    status: TenantStatus;
    createdAt: string; // ISO
}

export interface PagedResult<T> {
    items: T[];
    total: number;
    page: number; // 1-based
    pageSize: number;
}

export interface TenantQuery {
    q?: string;
    status?: TenantStatus | 'ALL';
    editionId?: string | 'ALL';
    page?: number; // 1-based
    pageSize?: number;
}

export interface TenantCreateInput {
    name: string;
    subdomain: string;
    editionId?: string | null;
    trialDays?: number | null;
}

export interface TenantUpdateInput {
    name: string;
    subdomain: string;
    editionId?: string | null;
    status?: TenantStatus;
}

export interface EditionLookup {
    id: string;
    name: string;
}
