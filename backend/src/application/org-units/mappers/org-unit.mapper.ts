import { OrgUnit } from '../../../domain/org-units/org-unit.entity';
import { OrgUnitMemberInfo } from '../../../domain/ports/out/org-unit-member-repository.port';
import { OrgUnitRoleAssignmentRecord } from '../../../domain/ports/out/org-unit-role-repository.port';
import { Role } from '../../../domain/rbac/entities/role.entity';

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
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

export type OrgUnitTreeItemDto = OrgUnitDto & {
    childCount: number;
};

export type OrgUnitBreadcrumbDto = {
    id: string;
    name: string;
};

export type OrgUnitDetailDto = OrgUnitDto & {
    breadcrumb: OrgUnitBreadcrumbDto[];
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

export const toOrgUnitDto = (unit: OrgUnit): OrgUnitDto => ({
    id: unit.id,
    tenantId: unit.tenantId,
    name: unit.name,
    code: unit.code,
    type: unit.type,
    status: unit.status,
    parentId: unit.parentId,
    path: unit.path,
    depth: unit.depth,
    sortOrder: unit.sortOrder,
    createdBy: unit.createdBy,
    updatedBy: unit.updatedBy,
    archivedAt: unit.archivedAt,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
});

export const toOrgUnitTreeItemDto = (unit: OrgUnit, childCount: number): OrgUnitTreeItemDto => ({
    ...toOrgUnitDto(unit),
    childCount,
});

export const toOrgUnitDetailDto = (
    unit: OrgUnit,
    breadcrumb: OrgUnitBreadcrumbDto[],
    childCount: number,
    membersCount: number,
    rolesCount: number,
): OrgUnitDetailDto => ({
    ...toOrgUnitDto(unit),
    breadcrumb,
    childCount,
    membersCount,
    rolesCount,
});

export const toOrgUnitDeleteImpactDto = (data: OrgUnitDeleteImpactDto): OrgUnitDeleteImpactDto => data;

export const toOrgUnitMemberDto = (member: OrgUnitMemberInfo): OrgUnitMemberDto => ({
    userId: member.userId,
    name: member.name,
    email: member.email,
    status: member.status,
    avatarUrl: member.avatarUrl ?? null,
    roleInUnit: member.roleInUnit ?? null,
    inherited: member.inherited ?? false,
});

export const toOrgUnitRoleAssignmentDto = (
    record: OrgUnitRoleAssignmentRecord,
    role?: Role | null,
): OrgUnitRoleAssignmentDto => ({
    roleId: record.roleId,
    scope: record.scope,
    inherited: record.inherited,
    role: role ? {
        id: role.id,
        name: role.name,
        description: role.description,
        status: role.status,
        scopeType: role.scopeType,
        isSystemRole: role.isSystemRole,
        isGlobal: role.isGlobal,
    } : undefined,
});
