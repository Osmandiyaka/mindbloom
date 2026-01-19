import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TenantContext } from '../../../../common/tenant/tenant.context';
import { TenantScopedRepository } from '../../../../common/tenant/tenant-scoped.repository';
import { OrgUnit } from '../../../../domain/org-units/org-unit.entity';
import { OrgUnitStatus } from '../../../../domain/org-units/org-unit.types';
import { IOrgUnitRepository, OrgUnitListQuery, OrgUnitListResult } from '../../../../domain/ports/out/org-unit-repository.port';

type OrgUnitDocument = {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId;
    name: string;
    code?: string;
    type: string;
    status: string;
    parentId?: Types.ObjectId | null;
    path: Types.ObjectId[];
    depth: number;
    sortOrder: number;
    createdBy?: Types.ObjectId | null;
    updatedBy?: Types.ObjectId | null;
    archivedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

@Injectable()
export class MongooseOrgUnitRepository extends TenantScopedRepository<OrgUnitDocument, OrgUnit> implements IOrgUnitRepository {
    constructor(
        @InjectModel('OrgUnit')
        private readonly orgUnitModel: Model<OrgUnitDocument>,
        tenantContext: TenantContext,
    ) {
        super(tenantContext);
    }

    async findById(id: string, tenantId: string): Promise<OrgUnit | null> {
        const resolved = this.requireTenant(tenantId);
        const doc = await this.orgUnitModel.findOne({
            _id: new Types.ObjectId(id),
            tenantId: new Types.ObjectId(resolved),
        });
        return doc ? this.toDomain(doc) : null;
    }

    async findByIds(ids: string[], tenantId: string): Promise<OrgUnit[]> {
        if (!ids.length) return [];
        const resolved = this.requireTenant(tenantId);
        const docs = await this.orgUnitModel.find({
            _id: { $in: ids.map(id => new Types.ObjectId(id)) },
            tenantId: new Types.ObjectId(resolved),
        });
        return docs.map(doc => this.toDomain(doc));
    }

    async findAll(tenantId: string, status?: OrgUnitStatus): Promise<OrgUnit[]> {
        const resolved = this.requireTenant(tenantId);
        const filter: Record<string, any> = { tenantId: new Types.ObjectId(resolved) };
        if (status) {
            filter.status = status;
        }
        const docs = await this.orgUnitModel.find(filter).sort({ sortOrder: 1, name: 1 });
        return docs.map(doc => this.toDomain(doc));
    }

    async list(query: OrgUnitListQuery): Promise<OrgUnitListResult> {
        const resolved = this.requireTenant(query.tenantId);
        const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
        const filter: Record<string, any> = { tenantId: new Types.ObjectId(resolved) };
        if (query.parentId !== undefined) {
            filter.parentId = query.parentId ? new Types.ObjectId(query.parentId) : null;
        }
        if (query.status) {
            filter.status = query.status;
        }
        if (query.search) {
            const search = query.search.trim();
            if (search) {
                filter.name = { $regex: search, $options: 'i' };
            }
        }
        if (query.cursor) {
            filter._id = { $gt: new Types.ObjectId(query.cursor) };
        }

        const docs = await this.orgUnitModel.find(filter)
            .sort({ _id: 1 })
            .limit(limit + 1);
        const items = docs.slice(0, limit).map(doc => this.toDomain(doc));
        const nextCursor = docs.length > limit ? docs[limit]._id.toString() : null;
        return { items, nextCursor };
    }

    async create(unit: OrgUnit): Promise<OrgUnit> {
        const resolved = this.requireTenant(unit.tenantId);
        const doc = new this.orgUnitModel({
            _id: Types.ObjectId.isValid(unit.id) ? new Types.ObjectId(unit.id) : undefined,
            tenantId: new Types.ObjectId(resolved),
            name: unit.name,
            code: unit.code ?? undefined,
            type: unit.type,
            status: unit.status,
            parentId: unit.parentId ? new Types.ObjectId(unit.parentId) : null,
            path: unit.path.map(id => new Types.ObjectId(id)),
            depth: unit.depth,
            sortOrder: unit.sortOrder,
            createdBy: unit.createdBy ? new Types.ObjectId(unit.createdBy) : undefined,
            updatedBy: unit.updatedBy ? new Types.ObjectId(unit.updatedBy) : undefined,
            archivedAt: unit.archivedAt ?? null,
        });
        const saved = await doc.save();
        return this.toDomain(saved);
    }

    async update(unit: OrgUnit): Promise<OrgUnit> {
        const resolved = this.requireTenant(unit.tenantId);
        const doc = await this.orgUnitModel.findOneAndUpdate(
            { _id: new Types.ObjectId(unit.id), tenantId: new Types.ObjectId(resolved) },
            {
                $set: {
                    name: unit.name,
                    code: unit.code ?? undefined,
                    type: unit.type,
                    status: unit.status,
                    sortOrder: unit.sortOrder,
                    updatedBy: unit.updatedBy ? new Types.ObjectId(unit.updatedBy) : undefined,
                    archivedAt: unit.archivedAt ?? null,
                    updatedAt: new Date(),
                },
            },
            { new: true },
        );
        if (!doc) {
            throw new Error('Org unit not found');
        }
        return this.toDomain(doc);
    }

    async updateMany(ids: string[], tenantId: string, patch: Partial<OrgUnit>): Promise<void> {
        if (!ids.length) return;
        const resolved = this.requireTenant(tenantId);
        const update: Record<string, any> = {};
        if (patch.status) update.status = patch.status;
        if (patch.archivedAt !== undefined) update.archivedAt = patch.archivedAt;
        if (patch.updatedBy !== undefined) update.updatedBy = patch.updatedBy ? new Types.ObjectId(patch.updatedBy) : null;
        if (!Object.keys(update).length) return;
        update.updatedAt = new Date();
        await this.orgUnitModel.updateMany(
            { _id: { $in: ids.map(id => new Types.ObjectId(id)) }, tenantId: new Types.ObjectId(resolved) },
            { $set: update },
        );
    }

    async findDescendants(tenantId: string, orgUnitId: string): Promise<OrgUnit[]> {
        const resolved = this.requireTenant(tenantId);
        const docs = await this.orgUnitModel.find({
            tenantId: new Types.ObjectId(resolved),
            path: new Types.ObjectId(orgUnitId),
        });
        return docs.map(doc => this.toDomain(doc));
    }

    private toDomain(doc: OrgUnitDocument): OrgUnit {
        return OrgUnit.create({
            id: doc._id.toString(),
            tenantId: doc.tenantId.toString(),
            name: doc.name,
            code: doc.code ?? null,
            type: doc.type as any,
            status: doc.status as any,
            parentId: doc.parentId ? doc.parentId.toString() : null,
            path: doc.path?.map(id => id.toString()) ?? [],
            depth: doc.depth ?? 0,
            sortOrder: doc.sortOrder ?? 0,
            createdBy: doc.createdBy ? doc.createdBy.toString() : null,
            updatedBy: doc.updatedBy ? doc.updatedBy.toString() : null,
            archivedAt: doc.archivedAt ?? null,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }
}
