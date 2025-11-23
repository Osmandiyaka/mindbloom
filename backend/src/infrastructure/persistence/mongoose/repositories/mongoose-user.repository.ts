import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../../../../domain/user/entities/user.entity';
import { IUserRepository } from '../../../../domain/user/ports/user.repository.interface';
import { UserDocument } from '../schemas/user.schema';
import { TenantContext } from '../../../../common/tenant/tenant.context';

@Injectable()
export class MongooseUserRepository implements IUserRepository {
    constructor(
        @InjectModel('User')
        private readonly userModel: Model<UserDocument>,
        private readonly tenantContext: TenantContext,
    ) { }

    async findByEmail(email: string): Promise<User | null> {
        // For login, we might not have tenant context yet
        // Allow finding by email across tenants for authentication
        const user = await this.userModel.findOne({ email }).exec();
        return user ? this.toDomain(user) : null;
    }

    async findById(id: string): Promise<User | null> {
        const user = await this.userModel.findById(id).exec();
        return user ? this.toDomain(user) : null;
    }

    async create(user: User, password: string): Promise<User> {
        const hashedPassword = await bcrypt.hash(password, 10);
        const tenantId = user.tenantId;

        const created = await this.userModel.create({
            tenantId,
            email: user.email,
            name: user.name,
            password: hashedPassword,
            role: user.role,
        });

        return this.toDomain(created);
    }

    async validatePassword(email: string, password: string): Promise<boolean> {
        const user = await this.userModel.findOne({ email }).exec();

        if (!user) {
            return false;
        }

        return await bcrypt.compare(password, user.password);
    }

    private toDomain(doc: UserDocument): User {
        return new User(
            doc.id,
            doc.tenantId.toString(),
            doc.email,
            doc.name,
            doc.role,
            [], // permissions - will be populated separately
            doc.createdAt,
            doc.updatedAt,
        );
    }
}
