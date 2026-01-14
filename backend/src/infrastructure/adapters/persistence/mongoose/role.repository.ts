import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from '../../../../domain/rbac/entities/role.entity';
import { Permission, PermissionAction } from '../../../../domain/rbac/entities/permission.entity';
import { createGlobalRoles, SYSTEM_ROLE_NAMES } from '../../../../domain/rbac/entities/system-roles';
import { IRoleRepository } from '../../../../domain/ports/out/role-repository.port';
import { RoleDocument } from './schemas/role.schema';
import { TenantScopedRepository } from '../../../../common/tenant/tenant-scoped.repository';
import { TenantContext } from '../../../../common/tenant/tenant.context';

@Injectable()
export class MongooseRoleRepository extends TenantScopedRepository<RoleDocument, Role> implements IRoleRepository {
    constructor(
        @InjectModel('Role')
        private readonly roleModel: Model<RoleDocument>,
        tenantContext: TenantContext,
    ) {
        super(tenantContext);
    }

    async create(role: Role): Promise<Role> {
        const tenantId = role.isGlobal ? null : this.requireTenant(role.tenantId || undefined);

        const doc = new this.roleModel({
            tenantId,
            name: role.name,
            description: role.description,
            isSystemRole: role.isSystemRole,
            isGlobal: role.isGlobal ?? false,
            scopeType: role.scopeType,
            status: role.status,
            permissions: role.permissions.map((p) => ({
                resource: p.resource,
                actions: p.actions,
                scope: p.scope,
                conditions: p.conditions,
            })),
            parentRoleId: role.parentRoleId,
        });

        const saved = await doc.save();
        return this.mapToEntity(saved);
    }

    async findById(id: string, tenantId: string): Promise<Role | null> {
        const resolved = this.requireTenant(tenantId);
        const doc = await this.roleModel
            .findOne({
                _id: id,
                $or: [
                    { tenantId: resolved },
                    { isGlobal: true },
                ],
            })
            .exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByName(name: string, tenantId: string): Promise<Role | null> {
        const resolved = this.requireTenant(tenantId);
        const doc = await this.roleModel
            .findOne({
                name,
                $or: [
                    { tenantId: resolved },
                    { isGlobal: true },
                ],
            })
            .exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findAll(tenantId: string): Promise<Role[]> {
        const resolved = this.requireTenant(tenantId);
        const docs = await this.roleModel
            .find({
                $or: [
                    { tenantId: resolved },
                    { isGlobal: true },
                ],
            })
            .exec();
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async findGlobalRoles(): Promise<Role[]> {
        const docs = await this.roleModel.find({ isGlobal: true }).exec();
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async findSystemRoles(_tenantId: string): Promise<Role[]> {
        // All system roles are global
        return this.findGlobalRoles();
    }

    async findCustomRoles(tenantId: string): Promise<Role[]> {
        const resolved = this.requireTenant(tenantId);
        const docs = await this.roleModel
            .find({ tenantId: resolved, isSystemRole: false })
            .exec();
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async update(role: Role): Promise<Role> {
        const filter = role.isGlobal
            ? { _id: role.id, isGlobal: true }
            : { _id: role.id, tenantId: this.requireTenant(role.tenantId) };

        const updated = await this.roleModel
            .findOneAndUpdate(
                filter,
                {
                    name: role.name,
                    description: role.description,
                    isGlobal: role.isGlobal ?? false,
                    isSystemRole: role.isSystemRole,
                    scopeType: role.scopeType,
                    status: role.status,
                    permissions: role.permissions.map((p) => ({
                        resource: p.resource,
                        actions: p.actions,
                        scope: p.scope,
                        conditions: p.conditions,
                    })),
                    parentRoleId: role.parentRoleId,
                    updatedAt: new Date(),
                },
                { new: true },
            )
            .exec();

        if (!updated) {
            throw new Error(`Role with ID "${role.id}" not found`);
        }

        return this.mapToEntity(updated);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        const result = await this.roleModel
            .deleteOne({
                _id: id,
                $or: [
                    { tenantId: this.requireTenant(tenantId) },
                    { isGlobal: true },
                ],
            })
            .exec();

        if (result.deletedCount === 0) {
            throw new Error(`Role with ID "${id}" not found`);
        }
    }

    async exists(name: string, tenantId: string): Promise<boolean> {
        const resolved = this.requireTenant(tenantId);
        const count = await this.roleModel
            .countDocuments({
                name,
                $or: [
                    { tenantId: resolved },
                    { isGlobal: true },
                ],
            })
            .exec();
        return count > 0;
    }

    async initializeSystemRoles(_tenantId: string): Promise<Role[]> {
        // Delegate to global initializer since all system roles are global
        return this.initializeGlobalRoles();
    }

    async initializeGlobalRoles(): Promise<Role[]> {
        const existing = await this.findGlobalRoles();

        // If roles already exist, ensure critical system roles carry wildcard access
        if (existing.length > 0) {
            let updated = false;

            for (const role of existing) {
                const isAdminRole = role.name === SYSTEM_ROLE_NAMES.HOST_ADMIN || role.name === SYSTEM_ROLE_NAMES.TENANT_ADMIN;
                if (!isAdminRole) {
                    continue;
                }

                const hasWildcard = role.permissions.some(
                    (p) => p.resource === '*' || p.actions?.includes(PermissionAction.MANAGE),
                );

                if (!hasWildcard) {
                    role.permissions.push(Permission.wildcard('*'));
                    await this.roleModel.updateOne(
                        { _id: role.id },
                        {
                            permissions: role.permissions.map((p) => ({
                                resource: p.resource,
                                actions: p.actions,
                                scope: p.scope,
                                conditions: p.conditions,
                            })),
                            updatedAt: new Date(),
                        },
                    ).exec();
                    updated = true;
                }
            }

            return updated ? this.findGlobalRoles() : existing;
        }

        const globalRoles = createGlobalRoles();
        const created: Role[] = [];

        for (const role of globalRoles) {
            const createdRole = await this.create(role);
            created.push(createdRole);
        }

        return created;
    }

    /**
     * Map MongoDB document to domain entity
     */
    private mapToEntity(doc: RoleDocument): Role {
        return new Role({
            id: doc._id.toString(),
            tenantId: doc.tenantId ?? null,
            name: doc.name,
            description: doc.description,
            isSystemRole: doc.isSystemRole,
            isGlobal: doc.isGlobal,
            scopeType: doc.scopeType,
            status: doc.status,
            permissions: doc.permissions.map(
                (p) =>
                    new Permission({
                        resource: p.resource,
                        actions: p.actions as any[],
                        scope: p.scope as any,
                        conditions: p.conditions,
                    }),
            ),
            parentRoleId: doc.parentRoleId,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }
}
