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
        const user = await this.userModel
            .findOne({ email })
            .populate('roleIds')
            .exec();
        return user ? this.toDomain(user) : null;
    }

    async findByEmailAndTenant(email: string, tenantId: string): Promise<User | null> {
        const user = await this.userModel
            .findOne({ email, tenantId })
            .populate('roleIds')
            .exec();
        return user ? this.toDomain(user) : null;
    }

    async findById(id: string): Promise<User | null> {
        const user = await this.userModel
            .findById(id)
            .populate('roleIds')
            .exec();
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
            roleIds: user.roleIds,
            profilePicture: user.profilePicture ?? null,
            gender: user.gender ?? null,
            dateOfBirth: user.dateOfBirth ?? null,
            phone: user.phone ?? null,
            forcePasswordReset: user.forcePasswordReset ?? false,
            mfaEnabled: user.mfaEnabled ?? false,
            status: user.status,
            schoolAccess: user.schoolAccess,
        });

        return this.toDomain(created);
    }

    async findAll(tenantId: string): Promise<User[]> {
        const resolved = this.requireTenant(tenantId);
        const users = await this.userModel
            .find({ tenantId: resolved })
            .populate('roleIds')
            .exec();
        return users.map(user => this.toDomain(user));
    }

    async list(query: {
        tenantId: string;
        search?: string;
        status?: string;
        roleId?: string;
        schoolId?: string;
        page?: number;
        pageSize?: number;
    }): Promise<{ items: User[]; total: number; page: number; pageSize: number }> {
        const resolved = this.requireTenant(query.tenantId);
        const page = Math.max(1, query.page ?? 1);
        const pageSize = Math.min(Math.max(1, query.pageSize ?? 20), 100);
        const filter: Record<string, any> = { tenantId: resolved };
        const andFilters: Record<string, any>[] = [];
        if (query.status) {
            filter.status = query.status;
        }
        if (query.roleId) {
            filter.roleIds = query.roleId;
        }
        if (query.schoolId) {
            andFilters.push({
                $or: [
                    { 'schoolAccess.scope': 'all' },
                    { 'schoolAccess.scope': 'selected', 'schoolAccess.schoolIds': query.schoolId },
                ],
            });
        }
        if (query.search) {
            const text = query.search.trim().toLowerCase();
            if (text) {
                andFilters.push({
                    $or: [
                        { email: { $regex: text, $options: 'i' } },
                        { name: { $regex: text, $options: 'i' } },
                    ],
                });
            }
        }
        if (andFilters.length) {
            filter.$and = andFilters;
        }

        const [total, users] = await Promise.all([
            this.userModel.countDocuments(filter).exec(),
            this.userModel
                .find(filter)
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .populate('roleIds')
                .exec(),
        ]);

        return {
            items: users.map(user => this.toDomain(user)),
            total,
            page,
            pageSize,
        };
    }

    async update(user: User): Promise<User> {
        const permissionIds = user.permissions.map(p => p.id);

        const updated = await this.userModel.findByIdAndUpdate(
            user.id,
            {
                roleIds: user.roleIds,
                permissions: permissionIds,
                forcePasswordReset: user.forcePasswordReset,
                mfaEnabled: user.mfaEnabled,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture ?? null,
                gender: user.gender ?? null,
                dateOfBirth: user.dateOfBirth ?? null,
                phone: user.phone ?? null,
                status: user.status,
                schoolAccess: user.schoolAccess,
                updatedAt: new Date(),
            },
            { new: true }
        ).populate('roleIds').exec();

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

    async validatePassword(email: string, password: string, tenantId?: string | null): Promise<boolean> {
        // If tenantId supplied, scope the lookup to avoid cross-tenant collisions
        const filter: any = { email };
        if (tenantId) {
            filter.tenantId = tenantId;
        }

        const user = await this.userModel.findOne(filter).exec();

        if (!user) {
            return false;
        }

        return await bcrypt.compare(password, user.password);
    }

    async setResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, {
            resetToken: tokenHash,
            resetTokenExpires: expiresAt
        }).exec();
    }

    async findByResetToken(tokenHash: string): Promise<User | null> {
        const now = new Date();
        const user = await this.userModel.findOne({ resetToken: tokenHash, resetTokenExpires: { $gt: now } }).exec();
        return user ? this.toDomain(user) : null;
    }

    async updatePassword(userId: string, password: string): Promise<void> {
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.userModel.findByIdAndUpdate(userId, {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpires: null,
            updatedAt: new Date()
        }).exec();
    }

    private toDomain(doc: UserDocument): User {
        // Convert populated role document to Role entity
        const roles: Role[] = [];
        const roleDocs = Array.isArray(doc.roleIds) ? doc.roleIds : [];
        for (const entry of roleDocs) {
            if (entry && typeof entry === 'object' && 'name' in entry) {
                const roleDoc = entry as any as RoleDocument;
                const rolePermissions = roleDoc.permissions?.map(p => new Permission({
                    id: '',
                    resource: p.resource,
                    displayName: p.resource,
                    description: undefined,
                    actions: p.actions as any[],
                    scope: p.scope as any,
                    parentId: undefined,
                    children: undefined,
                    icon: undefined,
                    order: undefined
                })) || [];

                roles.push(new Role({
                    id: roleDoc._id?.toString() || '',
                    tenantId: roleDoc.tenantId ? roleDoc.tenantId.toString() : null,
                    name: roleDoc.name,
                    description: roleDoc.description,
                    isSystemRole: roleDoc.isSystemRole,
                    isGlobal: (roleDoc as any).isGlobal,
                    permissions: rolePermissions,
                    parentRoleId: roleDoc.parentRoleId?.toString(),
                    createdAt: roleDoc.createdAt,
                    updatedAt: roleDoc.updatedAt
                }));
            }
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

        const roleIds = Array.isArray(doc.roleIds) && doc.roleIds.length
            ? doc.roleIds.map(roleId => (typeof roleId === 'object' && roleId && '_id' in roleId
                ? (roleId as any)._id?.toString()
                : String(roleId)))
            : [];

        const tenantId = doc.tenantId ? doc.tenantId.toString() : null;

        return User.create({
            id: doc.id,
            tenantId,
            email: doc.email,
            name: doc.name,
            roleIds,
            roles,
            permissions,
            profilePicture: doc.profilePicture,
            gender: doc.gender ?? null,
            dateOfBirth: doc.dateOfBirth ?? null,
            phone: doc.phone ?? null,
            forcePasswordReset: doc.forcePasswordReset ?? false,
            mfaEnabled: doc.mfaEnabled ?? false,
            status: (doc as any).status ?? 'active',
            schoolAccess: (doc as any).schoolAccess ?? { scope: 'all' },
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }
}
