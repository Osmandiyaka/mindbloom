import { School } from '../../school/entities/school.entity';
import { SCHOOL_REPOSITORY } from './repository.tokens';

export interface ISchoolRepository {
    findAll(tenantId: string): Promise<School[]>;
    findById(id: string, tenantId: string): Promise<School | null>;
    findByCode(code: string, tenantId: string): Promise<School | null>;
    create(school: School): Promise<School>;
    count(tenantId: string): Promise<number>;
}

export { SCHOOL_REPOSITORY };
