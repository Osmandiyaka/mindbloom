import { SectionEntity } from '../../academics/entities/section.entity';
import { PaginatedResult, PaginationInput } from './class-repository.port';

export type SectionListFilters = {
    classId?: string;
    schoolId?: string;
    status?: 'active' | 'archived';
    search?: string;
};

export interface ISectionRepository {
    findById(tenantId: string, id: string): Promise<SectionEntity | null>;
    list(tenantId: string, filters: SectionListFilters, pagination: PaginationInput): Promise<PaginatedResult<SectionEntity>>;
    create(entity: SectionEntity): Promise<SectionEntity>;
    update(entity: SectionEntity): Promise<SectionEntity>;
    archive(tenantId: string, id: string, actorUserId?: string | null): Promise<void>;
    restore(tenantId: string, id: string, actorUserId?: string | null): Promise<void>;
    existsActiveByNameScope(input: {
        tenantId: string;
        classId: string;
        schoolId: string;
        normalizedName: string;
        excludeId?: string;
    }): Promise<boolean>;
    listSchoolIdsByClass(tenantId: string, classId: string): Promise<string[]>;
    archiveByClassId(tenantId: string, classId: string): Promise<number>;
    restoreByClassId(tenantId: string, classId: string): Promise<number>;
}

export interface ISectionReadModelPort {
    listByClass(tenantId: string, classId: string, filters: SectionListFilters, pagination: PaginationInput): Promise<PaginatedResult<SectionEntity>>;
}

export { SECTION_REPOSITORY, SECTION_READ_MODEL } from './repository.tokens';
