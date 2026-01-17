import { School } from '../../school/entities/school.entity';
import { SCHOOL_REPOSITORY } from './repository.tokens';

export interface ISchoolRepository {
    findAll(tenantId: string): Promise<School[]>;
    findById(id: string, tenantId: string): Promise<School | null>;
    findByCode(code: string, tenantId: string): Promise<School | null>;
    create(school: School): Promise<School>;
    update(school: School): Promise<School>;
    delete(id: string, tenantId: string): Promise<void>;
    count(tenantId: string): Promise<number>;
}

export { SCHOOL_REPOSITORY };
