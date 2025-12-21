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

// Tenant Details + Metrics + Activity
export interface TenantDetails {
    id: string;
    name: string;
    subdomain: string;
    editionId?: string | null;
    editionName?: string | null;
    status: TenantStatus;
    createdAt: string; // ISO

    // Optional extras
    domain?: string | null;
    customDomain?: string | null;
    adminEmail?: string | null;
    subscriptionEndDate?: string | null;
}

export interface TenantMetrics {
    tenantId: string;

    studentsCount: number;
    teachersCount: number;
    usersCount: number;

    classesCount?: number;
    staffCount?: number;

    storageUsedMb?: number;
    storageLimitMb?: number;

    // Optional billing metrics
    mrr?: number;
    currency?: string;
}

export type TenantActivityType =
    | 'TENANT_CREATED'
    | 'TENANT_UPDATED'
    | 'STATUS_CHANGED'
    | 'USER_CREATED'
    | 'USER_LOGIN'
    | 'SUBSCRIPTION_CHANGED'
    | 'INVOICE_PAID'
    | 'SYSTEM_EVENT';

export interface TenantActivityItem {
    id: string;
    tenantId: string;
    type: TenantActivityType;
    message: string;
    createdAt: string; // ISO
    actorEmail?: string | null;
}

// Host view of tenant users
export interface TenantUser {
    id: string;
    email: string;
    name: string;
    roleId: string | null;
    role?: { id: string; name: string; description?: string; isSystemRole?: boolean } | null;
    profilePicture?: string | null;
    createdAt?: string | Date;
}

// Audit event used by host/tenant audit APIs
export interface AuditEvent {
    id: string;
    timestamp: string; // ISO
    tenantId?: string | null;
    category?: string | null;
    action?: string | null;
    severity?: 'INFO' | 'WARN' | 'CRITICAL' | null;
    result?: 'SUCCESS' | 'FAIL' | 'DENIED' | null;
    message?: string | null;
    actorEmailSnapshot?: string | null;
    targetType?: string | null;
    targetId?: string | null;
}
