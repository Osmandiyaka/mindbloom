import { ClassEntity } from '../../academics/entities/class.entity';

export type ClassListFilters = {
    schoolId?: string;
    academicYearId?: string;
    gradeId?: string;
    status?: 'active' | 'archived';
    search?: string;
};

export type ClassSort = {
    field?: 'sortOrder' | 'name' | 'createdAt';
    direction?: 'asc' | 'desc';
};

export type PaginationInput = {
    page?: number;
    pageSize?: number;
};

export type PaginatedResult<T> = {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
};

export type ClassWithCounts = ClassEntity & { sectionsCount: number };

export interface IClassRepository {
    findById(tenantId: string, id: string): Promise<ClassEntity | null>;
    list(tenantId: string, filters: ClassListFilters, pagination: PaginationInput, sort?: ClassSort): Promise<PaginatedResult<ClassEntity>>;
    listByGradeId(tenantId: string, gradeId: string, status?: 'active' | 'archived'): Promise<ClassEntity[]>;
    create(entity: ClassEntity): Promise<ClassEntity>;
    update(entity: ClassEntity): Promise<ClassEntity>;
    archive(tenantId: string, id: string, actorUserId?: string | null): Promise<void>;
    restore(tenantId: string, id: string, actorUserId?: string | null): Promise<void>;
    existsActiveByNameScope(input: {
        tenantId: string;
        academicYearId?: string | null;
        gradeId?: string | null;
        scopeKey: string;
        normalizedName: string;
        excludeId?: string;
    }): Promise<boolean>;
    findConflictsByNameOverlap(input: {
        tenantId: string;
        academicYearId?: string | null;
        gradeId?: string | null;
        normalizedName: string;
        schoolIds: string[];
        excludeId?: string;
    }): Promise<ClassEntity[]>;
    updateSortOrders(tenantId: string, updates: Array<{ id: string; sortOrder: number }>): Promise<void>;
}

export interface IClassReadModelPort {
    listWithCounts(tenantId: string, filters: ClassListFilters, pagination: PaginationInput, sort?: ClassSort): Promise<PaginatedResult<ClassWithCounts>>;
    countSectionsByClass(tenantId: string, classId: string): Promise<number>;
}

export { CLASS_REPOSITORY, CLASS_READ_MODEL } from './repository.tokens';
