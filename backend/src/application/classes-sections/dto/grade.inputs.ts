export type CreateGradeInput = {
    tenantId: string;
    schoolIds: string[];
    name: string;
    code?: string;
    sortOrder?: number;
    actorUserId?: string | null;
};

export type UpdateGradeInput = {
    tenantId: string;
    gradeId: string;
    schoolIds?: string[];
    name?: string;
    code?: string | null;
    sortOrder?: number;
    status?: 'active' | 'archived';
    actorUserId?: string | null;
};

export type ListGradesInput = {
    tenantId: string;
    schoolId?: string;
    status?: 'active' | 'archived';
    search?: string;
    page?: number;
    pageSize?: number;
};

export type ArchiveGradeImpactInput = {
    tenantId: string;
    gradeId: string;
};

export type ArchiveGradeInput = {
    tenantId: string;
    gradeId: string;
    confirmationText?: string;
    actorUserId?: string | null;
};

export type RestoreGradeInput = {
    tenantId: string;
    gradeId: string;
    actorUserId?: string | null;
};
