export type ClassConfigProps = {
    tenantId: string;
    classesScope: 'perAcademicYear' | 'global';
    requireGradeLink: boolean;
    sectionUniquenessScope: 'perClass' | 'perClassPerSchool';
    updatedAt?: Date;
    updatedBy?: string | null;
};

export class ClassConfigEntity {
    constructor(private readonly props: ClassConfigProps) {}

    get tenantId(): string {
        return this.props.tenantId;
    }

    get classesScope(): 'perAcademicYear' | 'global' {
        return this.props.classesScope;
    }

    get requireGradeLink(): boolean {
        return this.props.requireGradeLink;
    }

    get sectionUniquenessScope(): 'perClass' | 'perClassPerSchool' {
        return this.props.sectionUniquenessScope;
    }

    get updatedAt(): Date | undefined {
        return this.props.updatedAt;
    }

    get updatedBy(): string | null | undefined {
        return this.props.updatedBy;
    }

    toPrimitives(): ClassConfigProps {
        return { ...this.props };
    }

    withUpdates(update: Partial<Omit<ClassConfigProps, 'tenantId'>>): ClassConfigEntity {
        return new ClassConfigEntity({ ...this.props, ...update });
    }
}
