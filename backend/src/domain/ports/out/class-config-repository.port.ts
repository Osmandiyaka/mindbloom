import { ClassConfigEntity } from '../../academics/entities/class-config.entity';

export interface IClassConfigRepository {
    get(tenantId: string): Promise<ClassConfigEntity | null>;
    upsert(entity: ClassConfigEntity): Promise<ClassConfigEntity>;
}

export { CLASS_CONFIG_REPOSITORY } from './repository.tokens';
