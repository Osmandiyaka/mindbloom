import { User } from '../../entities/user.entity';

export interface IUserRepository {
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findAll(tenantId: string): Promise<User[]>;
    create(user: User, password: string): Promise<User>;
    update(user: User): Promise<User>;
    validatePassword(email: string, password: string): Promise<boolean>;
    delete(id: string, tenantId: string): Promise<void>;
}
