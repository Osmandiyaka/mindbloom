import { ORG_UNIT_MEMBER_REPOSITORY } from './repository.tokens';

export type OrgUnitMemberInfo = {
    userId: string;
    name: string;
    email: string;
    status?: string;
    avatarUrl?: string | null;
    roleInUnit?: string | null;
    inherited: boolean;
};

export interface IOrgUnitMemberRepository {
    listMembers(tenantId: string, orgUnitId: string, search?: string, includeInherited?: boolean): Promise<OrgUnitMemberInfo[]>;
    countMembers(tenantId: string, orgUnitIds: string[]): Promise<number>;
    addMembers(tenantId: string, orgUnitId: string, userIds: string[], createdBy?: string | null): Promise<void>;
    removeMember(tenantId: string, orgUnitId: string, userId: string): Promise<void>;
    removeByOrgUnitIds(tenantId: string, orgUnitIds: string[]): Promise<void>;
}

export { ORG_UNIT_MEMBER_REPOSITORY };
