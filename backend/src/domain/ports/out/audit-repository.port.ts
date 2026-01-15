export interface AuditEvent {
    id: string; // uuid
    timestamp: Date;
    correlationId?: string | null;
    requestId?: string | null;
    traceId?: string | null;

    scope: 'HOST' | 'TENANT';
    tenantId?: string | null;
    tenantNameSnapshot?: string | null;

    actorType: 'HOST_USER' | 'TENANT_USER' | 'SYSTEM';
    actorUserId?: string | null;
    actorEmailSnapshot?: string | null;
    actorRolesSnapshot?: string[] | null;
    actorTenantId?: string | null;

    isImpersonated?: boolean;
    impersonatorUserId?: string | null;
    impersonatorEmailSnapshot?: string | null;
    impersonatorTenantId?: string | null;
    impersonationReason?: string | null;

    category: string;
    action: string;
    severity: 'INFO' | 'WARN' | 'CRITICAL';
    result: 'SUCCESS' | 'FAIL' | 'DENIED';
    message?: string | null;
    tags?: string[] | null;

    targetType?: string | null;
    targetId?: string | null;
    targetNameSnapshot?: string | null;

    before?: any | null;
    after?: any | null;
    diff?: any | null;
    changedFields?: string[] | null;

    ipAddress?: string | null;
    userAgent?: string | null;
    route?: string | null;
    method?: string | null;
    statusCode?: number | null;
    durationMs?: number | null;

    isSensitive?: boolean;
    redactionLevel?: 'NONE' | 'PARTIAL' | 'FULL';
    dataClassification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
}

export interface AuditEventInput extends Partial<AuditEvent> {
    // required: category, action, scope
    category: string;
    action: string;
    scope: 'HOST' | 'TENANT';
}

export interface AuditQuery {
    q?: string;
    tenantId?: string;
    actorEmail?: string;
    action?: string;
    category?: string;
    severity?: string;
    result?: string;
    targetType?: string;
    targetId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    pageSize?: number;
}

export interface PagedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

export interface IAuditRepository {
    insert(event: AuditEventInput): Promise<void>;
    insertMany(events: AuditEventInput[]): Promise<void>;
    query(filters: AuditQuery): Promise<PagedResult<AuditEvent>>;
    findById(id: string): Promise<AuditEvent | null>;
    deleteOlderThan(date: Date): Promise<number>;
    redact(id: string, strategy: 'PARTIAL' | 'FULL'): Promise<void>;
}
