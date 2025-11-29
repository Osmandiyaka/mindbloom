import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../../../../domain/entities/user.entity';
import { IUserRepository } from '../../../../domain/ports/out/user-repository.port';
import { UserDocument } from './schemas/user.schema';
import { RoleDocument } from './schemas/role.schema';
import { TenantContext } from '../../../../common/tenant/tenant.context';
import { GetPermissionTreeUseCase } from '../../../../application/services/rbac/get-permission-tree.use-case';
import { Permission } from '../../../../domain/rbac/entities/permission.entity';
import { Role } from '../../../../domain/rbac/entities/role.entity';
import { TenantScopedRepository } from '../../../../common/tenant/tenant-scoped.repository';

@Injectable()
export class MongooseUserRepository extends TenantScopedRepository<UserDocument, User> implements IUserRepository {
    constructor(
        @InjectModel('User')
        private readonly userModel: Model<UserDocument>,
        tenantContext: TenantContext,
        @Optional() private readonly getPermissionTree?: GetPermissionTreeUseCase,
    ) {
        super(tenantContext);
    }

    async findByEmail(email: string): Promise<User | null> {
        // For login, we might not have tenant context yet
        // Allow finding by email across tenants for authentication
        const user = await this.userModel.findOne({ email }).populate('roleId').exec();
        return user ? this.toDomain(user) : null;
    }

    async findById(id: string): Promise<User | null> {
        const user = await this.userModel.findById(id).populate('roleId').exec();
        return user ? this.toDomain(user) : null;
    }

    async create(user: User, password: string): Promise<User> {
        const hashedPassword = await bcrypt.hash(password, 10);
        const tenantId = this.requireTenant(user.tenantId);

        const created = await this.userModel.create({
            tenantId,
            email: user.email,
            name: user.name,
            password: hashedPassword,
            roleId: user.roleId || null,
            forcePasswordReset: user.forcePasswordReset ?? false,
            mfaEnabled: user.mfaEnabled ?? false,
        });

        return this.toDomain(created);
    }

    async findAll(tenantId: string): Promise<User[]> {
        const resolved = this.requireTenant(tenantId);
        const users = await this.userModel.find({ tenantId: resolved }).populate('roleId').exec();
        return users.map(user => this.toDomain(user));
    }

    async update(user: User): Promise<User> {
        const permissionIds = user.permissions.map(p => p.id);

        const updated = await this.userModel.findByIdAndUpdate(
            user.id,
            {
                roleId: user.roleId,
                permissions: permissionIds,
                forcePasswordReset: user.forcePasswordReset,
                mfaEnabled: user.mfaEnabled,
                name: user.name,
                email: user.email,
                updatedAt: new Date(),
            },
            { new: true }
        ).populate('roleId').exec();

        if (!updated) {
            throw new Error(`User with ID ${user.id} not found`);
        }

        return this.toDomain(updated);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        const result = await this.userModel.deleteOne({ _id: id, tenantId: this.requireTenant(tenantId) }).exec();
        if (result.deletedCount === 0) {
            throw new Error(`User with ID ${id} not found`);
        }
    }

    async validatePassword(email: string, password: string): Promise<boolean> {
        const user = await this.userModel.findOne({ email }).exec();

        if (!user) {
            return false;
        }

        return await bcrypt.compare(password, user.password);
    }

    private toDomain(doc: UserDocument): User {
        // Convert populated role document to Role entity
        let role: Role | null = null;
        if (doc.roleId && typeof doc.roleId === 'object' && 'name' in doc.roleId) {
            const roleDoc = doc.roleId as any as RoleDocument;
            const rolePermissions = roleDoc.permissions?.map(p => new Permission({
                id: '', // Permission ID not stored in embedded schema
                resource: p.resource,
                displayName: p.resource, // Use resource as display name
                description: undefined,
                actions: p.actions as any[],
                scope: p.scope as any,
                parentId: undefined,
                children: undefined,
                icon: undefined,
                order: undefined
            })) || [];

            role = new Role({
                id: roleDoc._id?.toString() || '',
                tenantId: roleDoc.tenantId?.toString() || '',
                name: roleDoc.name,
                description: roleDoc.description,
                isSystemRole: roleDoc.isSystemRole,
                permissions: rolePermissions,
                parentRoleId: roleDoc.parentRoleId?.toString(),
                createdAt: roleDoc.createdAt,
                updatedAt: roleDoc.updatedAt
            });
        }

        // Convert permission IDs to Permission objects
        const permissions: Permission[] = [];
        if (this.getPermissionTree && doc.permissions && doc.permissions.length > 0) {
            for (const permId of doc.permissions) {
                const perm = this.getPermissionTree.findPermissionById(permId);
                if (perm) {
                    permissions.push(perm);
                }
            }
        }

        const roleId = doc.roleId
            ? (typeof doc.roleId === 'object' && '_id' in doc.roleId
                ? (doc.roleId as any)._id?.toString()
                : String(doc.roleId))
            : null;

        return new User(
            doc.id,
            doc.tenantId ? doc.tenantId.toString() : '',
            doc.email,
            doc.name,
            roleId,
            role,
            permissions,
            doc.profilePicture,
            doc.forcePasswordReset ?? false,
            doc.mfaEnabled ?? false,
            doc.createdAt,
            doc.updatedAt,
        );
    }
}
