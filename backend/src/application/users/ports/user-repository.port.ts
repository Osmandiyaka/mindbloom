import { User } from '../../../domain/entities/user.entity';
import { UserListQuery, UserListResult } from '../../../domain/ports/out/user-repository.port';

export interface UserRepositoryPort {
    findByEmail(email: string): Promise<User | null>;
    findByEmailAndTenant(email: string, tenantId: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findAll(tenantId: string): Promise<User[]>;
    list(query: UserListQuery): Promise<UserListResult>;
    create(user: User, password: string): Promise<User>;
    update(user: User): Promise<User>;
    delete(id: string, tenantId: string): Promise<void>;
}
