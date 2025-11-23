import { User } from '../entities/user.entity';

export interface IUserRepository {
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(user: User, password: string): Promise<User>;
    validatePassword(email: string, password: string): Promise<boolean>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
