import { Role } from '../../../domain/rbac/entities/role.entity';

export interface RoleRepositoryPort {
    findById(id: string, tenantId: string): Promise<Role | null>;
    findAll(tenantId: string): Promise<Role[]>;
}
