export type CreateSectionInput = {
    tenantId: string;
    classId: string;
    schoolId?: string;
    name: string;
    code?: string;
    capacity?: number | null;
    sortOrder?: number;
    actorUserId?: string | null;
};

export type UpdateSectionInput = {
    tenantId: string;
    sectionId: string;
    name?: string;
    code?: string | null;
    capacity?: number | null;
    sortOrder?: number;
    status?: 'active' | 'archived';
    actorUserId?: string | null;
};

export type ListSectionsByClassInput = {
    tenantId: string;
    classId: string;
    status?: 'active' | 'archived';
    search?: string;
    page?: number;
    pageSize?: number;
};

export type ArchiveSectionInput = {
    tenantId: string;
    sectionId: string;
    confirmationText?: string;
    actorUserId?: string | null;
};

export type RestoreSectionInput = {
    tenantId: string;
    sectionId: string;
    actorUserId?: string | null;
};
