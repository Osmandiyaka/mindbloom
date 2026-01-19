export type UpdateClassConfigInput = {
    tenantId: string;
    classesScope?: 'perAcademicYear' | 'global';
    requireGradeLink?: boolean;
    sectionUniquenessScope?: 'perClass' | 'perClassPerSchool';
    actorUserId?: string | null;
};

export type GetClassConfigInput = {
    tenantId: string;
};
