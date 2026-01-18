import { User } from '../../entities/user.entity';
import { UserStatus } from '../../users/user.types';

export type UserListQuery = {
    tenantId: string;
    search?: string;
    status?: UserStatus;
    roleId?: string;
    schoolId?: string;
    page?: number;
    pageSize?: number;
};

export type UserListResult = {
    items: User[];
    total: number;
    page: number;
    pageSize: number;
};

export interface IUserRepository {
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findAll(tenantId: string): Promise<User[]>;
    list(query: UserListQuery): Promise<UserListResult>;
    create(user: User, password: string): Promise<User>;
    update(user: User): Promise<User>;
    validatePassword(email: string, password: string, tenantId?: string | null): Promise<boolean>;
    findByEmailAndTenant(email: string, tenantId: string): Promise<User | null>;
    delete(id: string, tenantId: string): Promise<void>;
    setResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
    findByResetToken(tokenHash: string): Promise<User | null>;
    updatePassword(userId: string, password: string): Promise<void>;
}
