import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import {
    ApiEnvelope,
    OrgUnitApiService,
    OrgUnitDto,
    OrgUnitDeleteImpactDto,
    OrgUnitDetailDto,
    OrgUnitMemberDto,
    OrgUnitRoleAssignmentDto,
    OrgUnitTreeItemDto,
} from '../../../../../core/services/org-unit-api.service';

type OrgUnitStoreError = {
    code?: string;
    message?: string;
    details?: any;
};

@Injectable({ providedIn: 'root' })
export class OrgUnitStore {
    private readonly api: OrgUnitApiService = inject(OrgUnitApiService);

    tree = signal<OrgUnitTreeItemDto[]>([]);
    selectedOrgUnitId = signal<string | null>(null);
    selectedOrgUnit = signal<OrgUnitDetailDto | null>(null);
    members = signal<OrgUnitMemberDto[]>([]);
    roles = signal<OrgUnitRoleAssignmentDto[]>([]);

    treeLoading = signal(false);
    detailLoading = signal(false);
    membersLoading = signal(false);
    rolesLoading = signal(false);
    deleteImpactLoading = signal(false);

    treeError = signal<OrgUnitStoreError | null>(null);
    detailError = signal<OrgUnitStoreError | null>(null);
    membersError = signal<OrgUnitStoreError | null>(null);
    rolesError = signal<OrgUnitStoreError | null>(null);
    deleteError = signal<OrgUnitStoreError | null>(null);

    deleteImpact = signal<OrgUnitDeleteImpactDto | null>(null);

    selectedBreadcrumb = computed(() => this.selectedOrgUnit()?.breadcrumb ?? []);
    selectedCounts = computed(() => ({
        membersCount: this.selectedOrgUnit()?.membersCount ?? 0,
        rolesCount: this.selectedOrgUnit()?.rolesCount ?? 0,
        childCount: this.selectedOrgUnit()?.childCount ?? 0,
    }));

    constructor() {
        effect(() => {
            const selectedId = this.selectedOrgUnitId();
            if (!selectedId) {
                this.selectedOrgUnit.set(null);
                this.members.set([]);
                this.roles.set([]);
                return;
            }
            this.refreshSelected();
            this.loadMembers({});
            this.loadRoles();
        }, { allowSignalWrites: true });
    }

    loadTree(): void {
        this.treeLoading.set(true);
        this.treeError.set(null);
        this.api.getOrgUnitTree()
            .subscribe({
                next: (response: ApiEnvelope<OrgUnitTreeItemDto[]>) => {
                    this.tree.set(response.data ?? []);
                    const current = untracked(this.selectedOrgUnitId);
                    if (!current) {
                        const firstRoot = (response.data ?? []).find((item: OrgUnitTreeItemDto) => !item.parentId);
                        if (firstRoot) {
                            this.selectedOrgUnitId.set(firstRoot.id);
                        }
                    }
                },
                error: (error: OrgUnitStoreError) => this.treeError.set(error),
                complete: () => this.treeLoading.set(false),
            });
    }

    selectOrgUnit(id: string): void {
        this.selectedOrgUnitId.set(id);
    }

    refreshSelected(): void {
        const selectedId = this.selectedOrgUnitId();
        if (!selectedId) return;
        this.detailLoading.set(true);
        this.detailError.set(null);
        this.api.getOrgUnit(selectedId)
            .subscribe({
                next: (response: ApiEnvelope<OrgUnitDetailDto>) => this.selectedOrgUnit.set(response.data ?? null),
                error: (error: OrgUnitStoreError) => this.detailError.set(error),
                complete: () => this.detailLoading.set(false),
            });
    }

    loadMembers(params: { search?: string; includeInherited?: boolean }): void {
        const selectedId = this.selectedOrgUnitId();
        if (!selectedId) return;
        this.membersLoading.set(true);
        this.membersError.set(null);
        this.api.getMembers(selectedId, params)
            .subscribe({
                next: (response: ApiEnvelope<OrgUnitMemberDto[]>) => this.members.set(response.data ?? []),
                error: (error: OrgUnitStoreError) => this.membersError.set(error),
                complete: () => this.membersLoading.set(false),
            });
    }

    loadRoles(includeInherited = true): void {
        const selectedId = this.selectedOrgUnitId();
        if (!selectedId) return;
        this.rolesLoading.set(true);
        this.rolesError.set(null);
        this.api.getRoles(selectedId, includeInherited)
            .subscribe({
                next: (response: ApiEnvelope<OrgUnitRoleAssignmentDto[]>) => this.roles.set(response.data ?? []),
                error: (error: OrgUnitStoreError) => this.rolesError.set(error),
                complete: () => this.rolesLoading.set(false),
            });
    }

    createUnit(
        payload: { name: string; type?: string; status?: string; parentId?: string | null; code?: string; sortOrder?: number; },
        onSuccess?: (id: string) => void,
        onError?: (error: OrgUnitStoreError) => void,
    ): void {
        this.api.createOrgUnit(payload).subscribe({
            next: (response: ApiEnvelope<OrgUnitDto>) => {
                const created = response.data;
                if (created) {
                    this.tree.update(items => [...items, { ...created, childCount: 0 }]);
                    this.selectedOrgUnitId.set(created.id);
                    onSuccess?.(created.id);
                }
            },
            error: (error: OrgUnitStoreError) => {
                this.detailError.set(error);
                onError?.(error);
            },
        });
    }

    updateUnit(
        patch: { name?: string; type?: string; status?: string; code?: string | null; sortOrder?: number; },
        onSuccess?: () => void,
        onError?: (error: OrgUnitStoreError) => void,
    ): void {
        const selectedId = this.selectedOrgUnitId();
        if (!selectedId) return;
        this.api.updateOrgUnit(selectedId, patch)
            .subscribe({
                next: (response: ApiEnvelope<OrgUnitDto>) => {
                    const updated = response.data;
                    if (!updated) return;
                    this.tree.update(items => items.map(item => item.id === updated.id ? { ...item, ...updated } : item));
                    this.refreshSelected();
                    onSuccess?.();
                },
                error: (error: OrgUnitStoreError) => {
                    this.detailError.set(error);
                    onError?.(error);
                },
            });
    }

    loadDeleteImpact(): void {
        const selectedId = this.selectedOrgUnitId();
        if (!selectedId) return;
        this.deleteImpactLoading.set(true);
        this.deleteError.set(null);
        this.api.getDeleteImpact(selectedId)
            .subscribe({
                next: (response: ApiEnvelope<OrgUnitDeleteImpactDto>) => this.deleteImpact.set(response.data ?? null),
                error: (error: OrgUnitStoreError) => this.deleteError.set(error),
                complete: () => this.deleteImpactLoading.set(false),
            });
    }

    deleteUnit(confirmationText?: string, onSuccess?: () => void, onError?: (error: OrgUnitStoreError) => void): void {
        const selectedId = this.selectedOrgUnitId();
        if (!selectedId) return;
        this.deleteError.set(null);
        this.api.deleteOrgUnit(selectedId, confirmationText)
            .subscribe({
                next: () => {
                    this.selectedOrgUnitId.set(null);
                    this.loadTree();
                    onSuccess?.();
                },
                error: (error: OrgUnitStoreError) => {
                    this.deleteError.set(error);
                    onError?.(error);
                },
            });
    }

    addMembers(
        userIds: string[],
        onSuccess?: () => void,
        onError?: (error: OrgUnitStoreError) => void,
    ): void {
        const selectedId = this.selectedOrgUnitId();
        if (!selectedId) return;
        this.api.addMembers(selectedId, userIds)
            .subscribe({
                next: () => {
                    this.loadMembers({});
                    this.refreshSelected();
                    onSuccess?.();
                },
                error: (error: OrgUnitStoreError) => {
                    this.membersError.set(error);
                    onError?.(error);
                },
            });
    }

    removeMember(userId: string, onSuccess?: () => void): void {
        const selectedId = this.selectedOrgUnitId();
        if (!selectedId) return;
        this.api.removeMember(selectedId, userId)
            .subscribe({
                next: () => {
                    this.loadMembers({});
                    this.refreshSelected();
                    onSuccess?.();
                },
                error: (error: OrgUnitStoreError) => this.membersError.set(error),
            });
    }

    assignRoles(
        roleIds: string[],
        scope: string,
        onSuccess?: () => void,
        onError?: (error: OrgUnitStoreError) => void,
    ): void {
        const selectedId = this.selectedOrgUnitId();
        if (!selectedId) return;
        this.api.assignRoles(selectedId, roleIds, scope)
            .subscribe({
                next: () => {
                    this.loadRoles();
                    this.refreshSelected();
                    onSuccess?.();
                },
                error: (error: OrgUnitStoreError) => {
                    this.rolesError.set(error);
                    onError?.(error);
                },
            });
    }

    removeRole(roleId: string, onSuccess?: () => void): void {
        const selectedId = this.selectedOrgUnitId();
        if (!selectedId) return;
        this.api.removeRole(selectedId, roleId)
            .subscribe({
                next: () => {
                    this.loadRoles();
                    this.refreshSelected();
                    onSuccess?.();
                },
                error: (error: OrgUnitStoreError) => this.rolesError.set(error),
            });
    }
}
