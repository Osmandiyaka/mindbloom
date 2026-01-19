import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TenantContext } from '../../../../common/tenant/tenant.context';
import { TenantScopedRepository } from '../../../../common/tenant/tenant-scoped.repository';
import { OrgUnitRoleScope } from '../../../../domain/org-units/org-unit.types';
import {
    IOrgUnitRoleRepository,
    OrgUnitRoleAssignmentRecord,
} from '../../../../domain/ports/out/org-unit-role-repository.port';

type OrgUnitRoleAssignmentDocument = {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId;
    orgUnitId: Types.ObjectId;
    roleId: Types.ObjectId;
    scope: OrgUnitRoleScope;
    createdBy?: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
};

type OrgUnitDocument = {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId;
    path: Types.ObjectId[];
};

@Injectable()
export class MongooseOrgUnitRoleRepository extends TenantScopedRepository<OrgUnitRoleAssignmentDocument, any> implements IOrgUnitRoleRepository {
    constructor(
        @InjectModel('OrgUnitRoleAssignment')
        private readonly orgUnitRoleModel: Model<OrgUnitRoleAssignmentDocument>,
        @InjectModel('OrgUnit')
        private readonly orgUnitModel: Model<OrgUnitDocument>,
        tenantContext: TenantContext,
    ) {
        super(tenantContext);
    }

    async listRoles(
        tenantId: string,
        orgUnitId: string,
        includeInherited = false,
    ): Promise<OrgUnitRoleAssignmentRecord[]> {
        const resolved = this.requireTenant(tenantId);
        const baseId = new Types.ObjectId(orgUnitId);

        if (!includeInherited) {
            const docs = await this.orgUnitRoleModel.find({
                tenantId: new Types.ObjectId(resolved),
                orgUnitId: baseId,
            });
            return docs.map(doc => ({
                roleId: doc.roleId.toString(),
                scope: doc.scope,
                inherited: false,
            }));
        }

        const orgUnit = await this.orgUnitModel.findOne({
            tenantId: new Types.ObjectId(resolved),
            _id: baseId,
        }, { path: 1 });
        const ancestorIds = orgUnit?.path ?? [];
        const assignments: OrgUnitRoleAssignmentDocument[] = [];

        const direct = await this.orgUnitRoleModel.find({
            tenantId: new Types.ObjectId(resolved),
            orgUnitId: baseId,
        });
        assignments.push(...direct);

        if (ancestorIds.length) {
            const inherited = await this.orgUnitRoleModel.find({
                tenantId: new Types.ObjectId(resolved),
                orgUnitId: { $in: ancestorIds },
                scope: 'inheritsDown',
            });
            assignments.push(...inherited);
        }

        return assignments.map(doc => ({
            roleId: doc.roleId.toString(),
            scope: doc.scope,
            inherited: doc.orgUnitId.toString() !== orgUnitId,
        }));
    }

    async countAssignments(tenantId: string, orgUnitIds: string[]): Promise<number> {
        if (!orgUnitIds.length) return 0;
        const resolved = this.requireTenant(tenantId);
        return this.orgUnitRoleModel.countDocuments({
            tenantId: new Types.ObjectId(resolved),
            orgUnitId: { $in: orgUnitIds.map(id => new Types.ObjectId(id)) },
        });
    }

    async addRoles(
        tenantId: string,
        orgUnitId: string,
        roleIds: string[],
        scope: OrgUnitRoleScope,
        createdBy?: string | null,
    ): Promise<void> {
        if (!roleIds.length) return;
        const resolved = this.requireTenant(tenantId);
        const ops = roleIds.map(roleId => ({
            updateOne: {
                filter: {
                    tenantId: new Types.ObjectId(resolved),
                    orgUnitId: new Types.ObjectId(orgUnitId),
                    roleId: new Types.ObjectId(roleId),
                },
                update: {
                    $set: {
                        scope,
                        createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
                    },
                    $setOnInsert: {
                        tenantId: new Types.ObjectId(resolved),
                        orgUnitId: new Types.ObjectId(orgUnitId),
                        roleId: new Types.ObjectId(roleId),
                    },
                },
                upsert: true,
            },
        }));
        await this.orgUnitRoleModel.bulkWrite(ops, { ordered: false });
    }

    async removeRole(tenantId: string, orgUnitId: string, roleId: string): Promise<void> {
        const resolved = this.requireTenant(tenantId);
        await this.orgUnitRoleModel.deleteOne({
            tenantId: new Types.ObjectId(resolved),
            orgUnitId: new Types.ObjectId(orgUnitId),
            roleId: new Types.ObjectId(roleId),
        });
    }

    async removeByOrgUnitIds(tenantId: string, orgUnitIds: string[]): Promise<void> {
        if (!orgUnitIds.length) return;
        const resolved = this.requireTenant(tenantId);
        await this.orgUnitRoleModel.deleteMany({
            tenantId: new Types.ObjectId(resolved),
            orgUnitId: { $in: orgUnitIds.map(id => new Types.ObjectId(id)) },
        });
    }
}
