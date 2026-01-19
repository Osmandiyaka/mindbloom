import { GradeEntity } from '../../academics/entities/grade.entity';
import { PaginatedResult, PaginationInput } from './class-repository.port';

export type GradeListFilters = {
    schoolId?: string;
    status?: 'active' | 'archived';
    search?: string;
};

export interface IGradeRepository {
    findById(tenantId: string, id: string): Promise<GradeEntity | null>;
    list(tenantId: string, filters: GradeListFilters, pagination: PaginationInput): Promise<PaginatedResult<GradeEntity>>;
    create(entity: GradeEntity): Promise<GradeEntity>;
    update(entity: GradeEntity): Promise<GradeEntity>;
    archive(tenantId: string, id: string, actorUserId?: string | null): Promise<void>;
    restore(tenantId: string, id: string, actorUserId?: string | null): Promise<void>;
    existsActiveByNameScope(input: {
        tenantId: string;
        scopeKey: string;
        normalizedName: string;
        excludeId?: string;
    }): Promise<boolean>;
    findConflictsByNameOverlap(input: {
        tenantId: string;
        normalizedName: string;
        schoolIds: string[];
        excludeId?: string;
    }): Promise<GradeEntity[]>;
}

export { GRADE_REPOSITORY } from './repository.tokens';
