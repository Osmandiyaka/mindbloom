import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiClient, ApiError } from '../http/api-client.service';

export type ApiEnvelope<T> = { data: T; meta?: any; error?: any };

export type OrgUnitDto = {
    id: string;
    tenantId: string;
    name: string;
    code: string | null;
    type: string;
    status: string;
    parentId: string | null;
    path: string[];
    depth: number;
    sortOrder: number;
    createdBy: string | null;
    updatedBy: string | null;
    archivedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type OrgUnitTreeItemDto = OrgUnitDto & {
    childCount: number;
};

export type OrgUnitDetailDto = OrgUnitDto & {
    breadcrumb: Array<{ id: string; name: string }>;
    childCount: number;
    membersCount: number;
    rolesCount: number;
};

export type OrgUnitDeleteImpactDto = {
    descendantUnitsCount: number;
    membersDirectCount: number;
    membersInheritedCount: number;
    roleAssignmentsCount: number;
    rolesInheritedImpactCount: number;
    willDeleteUnitNamesPreview: string[];
};

export type OrgUnitMemberDto = {
    userId: string;
    name: string;
    email: string;
    status?: string;
    avatarUrl?: string | null;
    roleInUnit?: string | null;
    inherited: boolean;
};

export type OrgUnitRoleAssignmentDto = {
    roleId: string;
    scope: string;
    inherited: boolean;
    role?: {
        id: string;
        name: string;
        description: string;
        status: string;
        scopeType: string;
        isSystemRole: boolean;
        isGlobal?: boolean;
    };
};

export type OrgUnitCreateRequest = {
    name: string;
    code?: string;
    type?: string;
    status?: string;
    parentId?: string | null;
    sortOrder?: number;
};

export type OrgUnitUpdateRequest = {
    name?: string;
    code?: string | null;
    type?: string;
    status?: string;
    sortOrder?: number;
};

export type OrgUnitMembersQuery = {
    search?: string;
    includeInherited?: boolean;
};

export type ApiErrorShape = {
    code?: string;
    message?: string;
    details?: any;
};

@Injectable({ providedIn: 'root' })
export class OrgUnitApiService {
    private readonly api = inject(ApiClient);
    private readonly basePath = 'orgUnits';

    getOrgUnitTree(status?: string): Observable<ApiEnvelope<OrgUnitTreeItemDto[]>> {
        return this.api.get<ApiEnvelope<OrgUnitTreeItemDto[]>>(`${this.basePath}/tree`, {
            params: { status },
        }).pipe(catchError((err) => this.handleError(err)));
    }

    getOrgUnit(orgUnitId: string): Observable<ApiEnvelope<OrgUnitDetailDto>> {
        return this.api.get<ApiEnvelope<OrgUnitDetailDto>>(`${this.basePath}/${orgUnitId}`)
            .pipe(catchError((err) => this.handleError(err)));
    }

    listOrgUnits(params?: { parentId?: string | null; status?: string; search?: string; limit?: number; cursor?: string | null; }) {
        return this.api.get<ApiEnvelope<OrgUnitDto[]>>(`${this.basePath}`, { params })
            .pipe(catchError((err) => this.handleError(err)));
    }

    createOrgUnit(payload: OrgUnitCreateRequest): Observable<ApiEnvelope<OrgUnitDto>> {
        return this.api.post<ApiEnvelope<OrgUnitDto>>(`${this.basePath}`, payload)
            .pipe(catchError((err) => this.handleError(err)));
    }

    updateOrgUnit(orgUnitId: string, patch: OrgUnitUpdateRequest): Observable<ApiEnvelope<OrgUnitDto>> {
        return this.api.patch<ApiEnvelope<OrgUnitDto>>(`${this.basePath}/${orgUnitId}`, patch)
            .pipe(catchError((err) => this.handleError(err)));
    }

    getDeleteImpact(orgUnitId: string): Observable<ApiEnvelope<OrgUnitDeleteImpactDto>> {
        return this.api.post<ApiEnvelope<OrgUnitDeleteImpactDto>>(`${this.basePath}/${orgUnitId}/deleteImpact`)
            .pipe(catchError((err) => this.handleError(err)));
    }

    deleteOrgUnit(orgUnitId: string, confirmationText?: string): Observable<ApiEnvelope<{ success: boolean }>> {
        return this.api.delete<ApiEnvelope<{ success: boolean }>>(`${this.basePath}/${orgUnitId}`, {
            body: confirmationText ? { confirmationText } : undefined,
        } as any).pipe(catchError((err) => this.handleError(err)));
    }

    restoreOrgUnit(orgUnitId: string): Observable<ApiEnvelope<{ success: boolean }>> {
        return this.api.post<ApiEnvelope<{ success: boolean }>>(`${this.basePath}/${orgUnitId}/restore`)
            .pipe(catchError((err) => this.handleError(err)));
    }

    getMembers(orgUnitId: string, query?: OrgUnitMembersQuery): Observable<ApiEnvelope<OrgUnitMemberDto[]>> {
        return this.api.get<ApiEnvelope<OrgUnitMemberDto[]>>(`${this.basePath}/${orgUnitId}/members`, {
            params: query,
        }).pipe(catchError((err) => this.handleError(err)));
    }

    addMembers(orgUnitId: string, userIds: string[]): Observable<ApiEnvelope<{ success: boolean }>> {
        return this.api.post<ApiEnvelope<{ success: boolean }>>(`${this.basePath}/${orgUnitId}/members`, { userIds })
            .pipe(catchError((err) => this.handleError(err)));
    }

    removeMember(orgUnitId: string, userId: string): Observable<ApiEnvelope<{ success: boolean }>> {
        return this.api.delete<ApiEnvelope<{ success: boolean }>>(`${this.basePath}/${orgUnitId}/members/${userId}`)
            .pipe(catchError((err) => this.handleError(err)));
    }

    getRoles(orgUnitId: string, includeInherited?: boolean): Observable<ApiEnvelope<OrgUnitRoleAssignmentDto[]>> {
        return this.api.get<ApiEnvelope<OrgUnitRoleAssignmentDto[]>>(`${this.basePath}/${orgUnitId}/roles`, {
            params: { includeInherited },
        }).pipe(catchError((err) => this.handleError(err)));
    }

    assignRoles(orgUnitId: string, roleIds: string[], scope: string): Observable<ApiEnvelope<{ success: boolean }>> {
        return this.api.post<ApiEnvelope<{ success: boolean }>>(`${this.basePath}/${orgUnitId}/roles`, { roleIds, scope })
            .pipe(catchError((err) => this.handleError(err)));
    }

    removeRole(orgUnitId: string, roleId: string): Observable<ApiEnvelope<{ success: boolean }>> {
        return this.api.delete<ApiEnvelope<{ success: boolean }>>(`${this.basePath}/${orgUnitId}/roles/${roleId}`)
            .pipe(catchError((err) => this.handleError(err)));
    }

    private handleError(err: ApiError | ApiErrorShape): Observable<never> {
        const normalized: ApiErrorShape = {
            code: (err as ApiErrorShape).code ?? (err as any)?.error?.error,
            message: (err as ApiErrorShape).message ?? (err as any)?.message,
            details: (err as any)?.error?.details ?? (err as ApiErrorShape).details,
        };
        return throwError(() => normalized);
    }
}
