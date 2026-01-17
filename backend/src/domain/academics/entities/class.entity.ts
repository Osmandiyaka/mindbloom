export type ClassProps = {
    id: string;
    tenantId: string;
    name: string;
    code?: string;
    levelType?: string;
    sortOrder: number;
    active: boolean;
    schoolIds: string[] | null;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
};

export class ClassEntity {
    constructor(private readonly props: ClassProps) {}

    get id(): string {
        return this.props.id;
    }

    get tenantId(): string {
        return this.props.tenantId;
    }

    get name(): string {
        return this.props.name;
    }

    get code(): string | undefined {
        return this.props.code;
    }

    get levelType(): string | undefined {
        return this.props.levelType;
    }

    get sortOrder(): number {
        return this.props.sortOrder;
    }

    get active(): boolean {
        return this.props.active;
    }

    get schoolIds(): string[] | null {
        return this.props.schoolIds;
    }

    get notes(): string | undefined {
        return this.props.notes;
    }

    get createdAt(): Date | undefined {
        return this.props.createdAt;
    }

    get updatedAt(): Date | undefined {
        return this.props.updatedAt;
    }

    toPrimitives(): ClassProps {
        return { ...this.props };
    }

    withUpdates(update: Partial<Omit<ClassProps, 'id' | 'tenantId'>>): ClassEntity {
        return new ClassEntity({ ...this.props, ...update });
    }
}
