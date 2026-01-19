import { OrgUnitRoleScope } from './org-unit.types';

export type OrgUnitRoleAssignmentProps = {
    id: string;
    tenantId: string;
    orgUnitId: string;
    roleId: string;
    scope: OrgUnitRoleScope;
    createdBy?: string | null;
    createdAt: Date;
};

export class OrgUnitRoleAssignment {
    constructor(private readonly props: OrgUnitRoleAssignmentProps) { }

    get id() { return this.props.id; }
    get tenantId() { return this.props.tenantId; }
    get orgUnitId() { return this.props.orgUnitId; }
    get roleId() { return this.props.roleId; }
    get scope() { return this.props.scope; }
    get createdBy() { return this.props.createdBy ?? null; }
    get createdAt() { return this.props.createdAt; }

    static create(data: {
        id?: string;
        tenantId: string;
        orgUnitId: string;
        roleId: string;
        scope?: OrgUnitRoleScope;
        createdBy?: string | null;
        createdAt?: Date;
    }): OrgUnitRoleAssignment {
        return new OrgUnitRoleAssignment({
            id: data.id ?? crypto.randomUUID(),
            tenantId: data.tenantId,
            orgUnitId: data.orgUnitId,
            roleId: data.roleId,
            scope: data.scope ?? 'inheritsDown',
            createdBy: data.createdBy ?? null,
            createdAt: data.createdAt ?? new Date(),
        });
    }
}
