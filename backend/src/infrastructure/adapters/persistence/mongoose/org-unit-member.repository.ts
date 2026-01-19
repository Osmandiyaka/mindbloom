import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TenantContext } from '../../../../common/tenant/tenant.context';
import { TenantScopedRepository } from '../../../../common/tenant/tenant-scoped.repository';
import { IOrgUnitMemberRepository, OrgUnitMemberInfo } from '../../../../domain/ports/out/org-unit-member-repository.port';

type OrgUnitMemberDocument = {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId;
    orgUnitId: Types.ObjectId;
    userId: Types.ObjectId;
    roleInUnit?: string;
    inherited?: boolean;
    createdBy?: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
};

type OrgUnitDocument = {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId;
    path: Types.ObjectId[];
};

type UserDocument = {
    _id: Types.ObjectId;
    tenantId?: Types.ObjectId | null;
    name?: string;
    email: string;
    status?: string;
    profilePicture?: string | null;
};

@Injectable()
export class MongooseOrgUnitMemberRepository extends TenantScopedRepository<OrgUnitMemberDocument, any> implements IOrgUnitMemberRepository {
    constructor(
        @InjectModel('OrgUnitMember')
        private readonly orgUnitMemberModel: Model<OrgUnitMemberDocument>,
        @InjectModel('OrgUnit')
        private readonly orgUnitModel: Model<OrgUnitDocument>,
        @InjectModel('User')
        private readonly userModel: Model<UserDocument>,
        tenantContext: TenantContext,
    ) {
        super(tenantContext);
    }

    async listMembers(
        tenantId: string,
        orgUnitId: string,
        search?: string,
        includeInherited = false,
    ): Promise<OrgUnitMemberInfo[]> {
        const resolved = this.requireTenant(tenantId);
        const orgUnitIds = await this.resolveOrgUnitIds(resolved, orgUnitId, includeInherited);
        if (!orgUnitIds.length) return [];
        const members = await this.orgUnitMemberModel.find({
            tenantId: new Types.ObjectId(resolved),
            orgUnitId: { $in: orgUnitIds },
        });
        if (!members.length) return [];
        const userIds = Array.from(new Set(members.map(member => member.userId.toString())));
        const userFilter: Record<string, any> = { _id: { $in: userIds.map(id => new Types.ObjectId(id)) } };
        const users = await this.userModel.find(userFilter);
        const userMap = new Map(users.map(user => [user._id.toString(), user]));
        const query = search?.trim().toLowerCase();
        const results = members.map(member => {
            const user = userMap.get(member.userId.toString());
            return {
                userId: member.userId.toString(),
                name: user?.name || '',
                email: user?.email || '',
                status: user?.status,
                avatarUrl: user?.profilePicture ?? null,
                roleInUnit: member.roleInUnit ?? null,
                inherited: includeInherited && member.orgUnitId.toString() !== orgUnitId,
            };
        }).filter(member => {
            if (!query) return true;
            const haystack = `${member.name} ${member.email}`.toLowerCase();
            return haystack.includes(query);
        });
        return results;
    }

    async countMembers(tenantId: string, orgUnitIds: string[]): Promise<number> {
        if (!orgUnitIds.length) return 0;
        const resolved = this.requireTenant(tenantId);
        return this.orgUnitMemberModel.countDocuments({
            tenantId: new Types.ObjectId(resolved),
            orgUnitId: { $in: orgUnitIds.map(id => new Types.ObjectId(id)) },
        });
    }

    async addMembers(tenantId: string, orgUnitId: string, userIds: string[], createdBy?: string | null): Promise<void> {
        if (!userIds.length) return;
        const resolved = this.requireTenant(tenantId);
        const ops = userIds.map(userId => ({
            updateOne: {
                filter: {
                    tenantId: new Types.ObjectId(resolved),
                    orgUnitId: new Types.ObjectId(orgUnitId),
                    userId: new Types.ObjectId(userId),
                },
                update: {
                    $setOnInsert: {
                        tenantId: new Types.ObjectId(resolved),
                        orgUnitId: new Types.ObjectId(orgUnitId),
                        userId: new Types.ObjectId(userId),
                        createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
                    },
                },
                upsert: true,
            },
        }));
        await this.orgUnitMemberModel.bulkWrite(ops, { ordered: false });
    }

    async removeMember(tenantId: string, orgUnitId: string, userId: string): Promise<void> {
        const resolved = this.requireTenant(tenantId);
        await this.orgUnitMemberModel.deleteOne({
            tenantId: new Types.ObjectId(resolved),
            orgUnitId: new Types.ObjectId(orgUnitId),
            userId: new Types.ObjectId(userId),
        });
    }

    async removeByOrgUnitIds(tenantId: string, orgUnitIds: string[]): Promise<void> {
        if (!orgUnitIds.length) return;
        const resolved = this.requireTenant(tenantId);
        await this.orgUnitMemberModel.deleteMany({
            tenantId: new Types.ObjectId(resolved),
            orgUnitId: { $in: orgUnitIds.map(id => new Types.ObjectId(id)) },
        });
    }

    private async resolveOrgUnitIds(
        tenantId: string,
        orgUnitId: string,
        includeInherited: boolean,
    ): Promise<Types.ObjectId[]> {
        const baseId = new Types.ObjectId(orgUnitId);
        if (!includeInherited) return [baseId];
        const docs = await this.orgUnitModel.find({
            tenantId: new Types.ObjectId(tenantId),
            $or: [{ _id: baseId }, { path: baseId }],
        }, { _id: 1 });
        return docs.map(doc => doc._id);
    }
}
