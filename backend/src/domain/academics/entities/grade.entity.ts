export type GradeProps = {
    id: string;
    tenantId: string;
    schoolIds: string[];
    name: string;
    normalizedName: string;
    code?: string;
    sortOrder: number;
    status: 'active' | 'archived';
    createdAt?: Date;
    updatedAt?: Date;
    archivedAt?: Date | null;
};

export class GradeEntity {
    constructor(private readonly props: GradeProps) {}

    get id(): string {
        return this.props.id;
    }

    get tenantId(): string {
        return this.props.tenantId;
    }

    get schoolIds(): string[] {
        return this.props.schoolIds;
    }

    get name(): string {
        return this.props.name;
    }

    get normalizedName(): string {
        return this.props.normalizedName;
    }

    get code(): string | undefined {
        return this.props.code;
    }

    get sortOrder(): number {
        return this.props.sortOrder;
    }

    get status(): 'active' | 'archived' {
        return this.props.status;
    }

    get createdAt(): Date | undefined {
        return this.props.createdAt;
    }

    get updatedAt(): Date | undefined {
        return this.props.updatedAt;
    }

    get archivedAt(): Date | null | undefined {
        return this.props.archivedAt;
    }

    toPrimitives(): GradeProps {
        return { ...this.props };
    }

    withUpdates(update: Partial<Omit<GradeProps, 'id' | 'tenantId'>>): GradeEntity {
        return new GradeEntity({ ...this.props, ...update });
    }
}
