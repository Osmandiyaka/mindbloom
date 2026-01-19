export type CreateClassInput = {
    tenantId: string;
    schoolIds: string[];
    academicYearId?: string | null;
    gradeId?: string | null;
    name: string;
    code?: string;
    sortOrder?: number;
    actorUserId?: string | null;
};

export type UpdateClassInput = {
    tenantId: string;
    classId: string;
    schoolIds?: string[];
    academicYearId?: string | null;
    gradeId?: string | null;
    name?: string;
    code?: string | null;
    sortOrder?: number;
    status?: 'active' | 'archived';
    actorUserId?: string | null;
};

export type ListClassesInput = {
    tenantId: string;
    schoolId?: string;
    academicYearId?: string;
    gradeId?: string;
    status?: 'active' | 'archived';
    search?: string;
    page?: number;
    pageSize?: number;
    includeCounts?: boolean;
};

export type ArchiveClassImpactInput = {
    tenantId: string;
    classId: string;
};

export type ArchiveClassInput = {
    tenantId: string;
    classId: string;
    confirmationText?: string;
    actorUserId?: string | null;
};

export type RestoreClassInput = {
    tenantId: string;
    classId: string;
    actorUserId?: string | null;
};

export type ReorderClassesInput = {
    tenantId: string;
    updates: Array<{ id: string; sortOrder: number }>;
    actorUserId?: string | null;
};
