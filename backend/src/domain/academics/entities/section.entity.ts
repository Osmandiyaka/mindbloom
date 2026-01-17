export type SectionProps = {
    id: string;
    tenantId: string;
    classId: string;
    name: string;
    code?: string;
    capacity?: number;
    homeroomTeacherId?: string;
    active: boolean;
    sortOrder: number;
    createdAt?: Date;
    updatedAt?: Date;
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

    get name(): string {
        return this.props.name;
    }

    get code(): string | undefined {
        return this.props.code;
    }

    get capacity(): number | undefined {
        return this.props.capacity;
    }

    get homeroomTeacherId(): string | undefined {
        return this.props.homeroomTeacherId;
    }

    get active(): boolean {
        return this.props.active;
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

    toPrimitives(): SectionProps {
        return { ...this.props };
    }

    withUpdates(update: Partial<Omit<SectionProps, 'id' | 'tenantId'>>): SectionEntity {
        return new SectionEntity({ ...this.props, ...update });
    }
}
