import { OrgUnitStatus, OrgUnitType } from './org-unit.types';

type OrgUnitProps = {
    id: string;
    tenantId: string;
    name: string;
    code?: string | null;
    type: OrgUnitType;
    status: OrgUnitStatus;
    parentId?: string | null;
    path: string[];
    depth: number;
    sortOrder: number;
    createdBy?: string | null;
    updatedBy?: string | null;
    archivedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

export class OrgUnit {
    constructor(private readonly props: OrgUnitProps) { }

    get id() { return this.props.id; }
    get tenantId() { return this.props.tenantId; }
    get name() { return this.props.name; }
    get code() { return this.props.code ?? null; }
    get type() { return this.props.type; }
    get status() { return this.props.status; }
    get parentId() { return this.props.parentId ?? null; }
    get path() { return this.props.path; }
    get depth() { return this.props.depth; }
    get sortOrder() { return this.props.sortOrder; }
    get createdBy() { return this.props.createdBy ?? null; }
    get updatedBy() { return this.props.updatedBy ?? null; }
    get archivedAt() { return this.props.archivedAt ?? null; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }

    static create(data: {
        id?: string;
        tenantId: string;
        name: string;
        code?: string | null;
        type?: OrgUnitType;
        status?: OrgUnitStatus;
        parentId?: string | null;
        path?: string[];
        depth?: number;
        sortOrder?: number;
        createdBy?: string | null;
        updatedBy?: string | null;
        archivedAt?: Date | null;
        createdAt?: Date;
        updatedAt?: Date;
    }): OrgUnit {
        const now = new Date();
        return new OrgUnit({
            id: data.id ?? crypto.randomUUID(),
            tenantId: data.tenantId,
            name: data.name.trim(),
            code: data.code?.trim() || null,
            type: data.type ?? 'department',
            status: data.status ?? 'active',
            parentId: data.parentId ?? null,
            path: data.path ?? [],
            depth: data.depth ?? (data.path?.length ?? 0),
            sortOrder: data.sortOrder ?? 0,
            createdBy: data.createdBy ?? null,
            updatedBy: data.updatedBy ?? null,
            archivedAt: data.archivedAt ?? null,
            createdAt: data.createdAt ?? now,
            updatedAt: data.updatedAt ?? now,
        });
    }
}
