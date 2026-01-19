import { OrgUnitRoleScope } from '../../org-units/org-unit.types';
import { ORG_UNIT_ROLE_REPOSITORY } from './repository.tokens';

export type OrgUnitRoleAssignmentRecord = {
    roleId: string;
    scope: OrgUnitRoleScope;
    inherited: boolean;
};

export interface IOrgUnitRoleRepository {
    listRoles(tenantId: string, orgUnitId: string, includeInherited?: boolean): Promise<OrgUnitRoleAssignmentRecord[]>;
    countAssignments(tenantId: string, orgUnitIds: string[]): Promise<number>;
    addRoles(
        tenantId: string,
        orgUnitId: string,
        roleIds: string[],
        scope: OrgUnitRoleScope,
        createdBy?: string | null
    ): Promise<void>;
    removeRole(tenantId: string, orgUnitId: string, roleId: string): Promise<void>;
    removeByOrgUnitIds(tenantId: string, orgUnitIds: string[]): Promise<void>;
}

export { ORG_UNIT_ROLE_REPOSITORY };
