export type OrgUnitMemberProps = {
    id: string;
    tenantId: string;
    orgUnitId: string;
    userId: string;
    roleInUnit?: string | null;
    inherited: boolean;
    createdBy?: string | null;
    createdAt: Date;
};

export class OrgUnitMember {
    constructor(private readonly props: OrgUnitMemberProps) { }

    get id() { return this.props.id; }
    get tenantId() { return this.props.tenantId; }
    get orgUnitId() { return this.props.orgUnitId; }
    get userId() { return this.props.userId; }
    get roleInUnit() { return this.props.roleInUnit ?? null; }
    get inherited() { return this.props.inherited; }
    get createdBy() { return this.props.createdBy ?? null; }
    get createdAt() { return this.props.createdAt; }

    static create(data: {
        id?: string;
        tenantId: string;
        orgUnitId: string;
        userId: string;
        roleInUnit?: string | null;
        inherited?: boolean;
        createdBy?: string | null;
        createdAt?: Date;
    }): OrgUnitMember {
        return new OrgUnitMember({
            id: data.id ?? crypto.randomUUID(),
            tenantId: data.tenantId,
            orgUnitId: data.orgUnitId,
            userId: data.userId,
            roleInUnit: data.roleInUnit ?? null,
            inherited: data.inherited ?? false,
            createdBy: data.createdBy ?? null,
            createdAt: data.createdAt ?? new Date(),
        });
    }
}
