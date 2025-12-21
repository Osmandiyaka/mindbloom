import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
    EditionLookup,
    Edition,
    EditionFeatureAssignment,
    EditionWithFeatures,
    EditionUpsertInput,
    PagedResult,
    TenantCreateInput,
    TenantListItem,
    TenantQuery,
    TenantUpdateInput,
    TenantDetails,
    TenantMetrics,
    TenantActivityItem,
    AuditEvent,
    TenantUser,
} from './models';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class HostApi {
    private http = inject(HttpClient);

    listTenants(query: TenantQuery) {
        // Map our frontend query shape to backend ListTenantsQueryDto
        let params = new HttpParams()
            .set('page', String(query.page ?? 1))
            .set('pageSize', String(query.pageSize ?? 10));

        if (query.q) params = params.set('search', query.q);
        if (query.status && query.status !== 'ALL') params = params.set('statuses', query.status);
        // editionId filter is not supported server-side yet; ignore for now

        // Backend returns { data: Tenant[], total, page, pageSize }
        return this.http.get<any>('/api/tenants', { params }).pipe(
            // lazy map to our frontend PagedResult<TenantListItem>
            // import map from 'rxjs/operators' at top
            map(res => {
                const normalizeStatus = (s: any) => {
                    if (!s) return 'ACTIVE' as any;
                    const up = String(s).toUpperCase();
                    if (up === 'PENDING') return 'TRIAL';
                    if (['ACTIVE', 'SUSPENDED', 'TRIAL'].includes(up)) return up as any;
                    return up as any;
                };

                const items: TenantListItem[] = (res?.data || []).map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    subdomain: t.subdomain,
                    editionId: t.editionId ?? null,
                    editionName: t.editionName ?? (t.edition ?? t.metadata?.editionCode ?? null),
                    status: normalizeStatus(t.status),
                    createdAt: t.createdAt,
                }));

                return {
                    items,
                    total: res?.total ?? 0,
                    page: res?.page ?? 1,
                    pageSize: res?.pageSize ?? Number(params.get('pageSize') ?? 10),
                } as PagedResult<TenantListItem>;
            })
        );
    }

    createTenant(input: TenantCreateInput) {
        return this.http.post<{ id: string }>('/api/tenants', input);
    }

    updateTenant(tenantId: string, input: TenantUpdateInput) {
        // Host update endpoint not implemented server-side yet — optimistic path
        return this.http.put<void>(`/api/tenants/${tenantId}`, input);
    }

    suspendTenant(tenantId: string, reason = 'Suspended by host') {
        return this.http.post<void>(`/api/host/tenants/${tenantId}/suspend`, { reason });
    }

    activateTenant(tenantId: string) {
        // Backend reactivation endpoint is named 'reactivate'
        return this.http.post<void>(`/api/host/tenants/${tenantId}/reactivate`, {});
    }

    getTenantDetails(tenantId: string) {
        return this.http.get<TenantDetails>(`/api/host/tenants/${tenantId}`);
    }

    getTenantMetrics(tenantId: string) {
        return this.http.get<TenantMetrics>(`/api/host/tenants/${tenantId}/metrics`);
    }

    getTenantActivity(tenantId: string, limit = 20) {
        const params = new HttpParams().set('limit', String(limit));
        return this.http.get<TenantActivityItem[]>(`/api/host/tenants/${tenantId}/activity`, { params });
    }

    getTenantUsers(tenantId: string) {
        return this.http.get<TenantUser[]>(`/api/host/tenants/${tenantId}/users`);
    }

    // Query host audit logs filtered to a tenant
    getTenantAudit(tenantId: string, page = 1, pageSize = 20, q?: string) {
        let params = new HttpParams()
            .set('tenantId', tenantId)
            .set('page', String(page))
            .set('pageSize', String(pageSize));
        if (q) params = params.set('q', q);
        return this.http.get<PagedResult<AuditEvent>>(`/api/host/audit`, { params });
    }

    getAuditEvent(id: string) {
        return this.http.get<AuditEvent>(`/api/host/audit/${id}`);
    }

    // Impersonation (host → tenant/user)
    impersonateTenant(tenantId: string, reason?: string) {
        return this.http.post<any>(`/api/host/impersonation/tenant/${tenantId}`, { reason }, { withCredentials: true });
    }

    impersonateTenantUser(tenantId: string, userId: string, reason?: string) {
        return this.http.post<any>(`/api/host/impersonation/tenant/${tenantId}/users/${userId}`, { reason }, { withCredentials: true });
    }

    // Optional: for filter dropdown
    listEditionsLookup() {
        return this.http.get<EditionLookup[]>('/api/host/editions');
    }

    // Host edition management
    listHostEditions() {
        return this.http.get<Edition[]>('/api/host/editions');
    }

    getHostEdition(id: string) {
        return this.http.get<EditionWithFeatures>(`/api/host/editions/${id}`);
    }

    createHostEdition(input: EditionUpsertInput & { name: string }) {
        return this.http.post<Edition>('/api/host/editions', input);
    }

    updateHostEdition(id: string, input: EditionUpsertInput) {
        return this.http.put<Edition>(`/api/host/editions/${id}`, input);
    }

    setHostEditionFeatures(id: string, features: EditionFeatureAssignment[]) {
        return this.http.put(`/api/host/editions/${id}/features`, { features });
    }
}

