export type SectionProps = {
    id: string;
    tenantId: string;
    classId: string;
    academicYearId?: string;
    name: string;
    normalizedName: string;
    code?: string;
    capacity?: number;
    status: 'active' | 'archived';
    sortOrder: number;
    createdAt?: Date;
    updatedAt?: Date;
    archivedAt?: Date | null;
};

export class SectionEntity {
    constructor(private readonly props: SectionProps) {}

    get id(): string {
        return this.props.id;
    }

    get tenantId(): string {
        return this.props.tenantId;
    }

    get classId(): string {
        return this.props.classId;
    }

    get academicYearId(): string | undefined {
        return this.props.academicYearId;
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

    get capacity(): number | undefined {
        return this.props.capacity;
    }

    get status(): 'active' | 'archived' {
        return this.props.status;
    }

    get sortOrder(): number {
        return this.props.sortOrder;
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

    toPrimitives(): SectionProps {
        return { ...this.props };
    }

    withUpdates(update: Partial<Omit<SectionProps, 'id' | 'tenantId'>>): SectionEntity {
        return new SectionEntity({ ...this.props, ...update });
    }
}
