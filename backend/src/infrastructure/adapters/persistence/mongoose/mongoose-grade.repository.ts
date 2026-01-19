import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GradeEntity } from '../../../../domain/academics/entities/grade.entity';
import { GradeListFilters, IGradeRepository } from '../../../../domain/ports/out/grade-repository.port';
import { PaginatedResult, PaginationInput } from '../../../../domain/ports/out/class-repository.port';

type GradeDoc = {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId;
    schoolIds: Types.ObjectId[];
    name: string;
    normalizedName: string;
    code?: string;
    sortOrder: number;
    status: 'active' | 'archived';
    scopeKey: string;
    archivedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
};

@Injectable()
export class MongooseGradeRepository implements IGradeRepository {
    constructor(@InjectModel('Grade') private readonly gradeModel: Model<GradeDoc>) {}

    async findById(tenantId: string, id: string): Promise<GradeEntity | null> {
        const doc = await this.gradeModel.findOne({ _id: id, tenantId }).lean().exec();
        return doc ? this.toEntity(doc) : null;
    }

    async list(
        tenantId: string,
        filters: GradeListFilters,
        pagination: PaginationInput,
    ): Promise<PaginatedResult<GradeEntity>> {
        const query = this.buildFilters(tenantId, filters);
        const page = pagination.page ?? 1;
        const pageSize = pagination.pageSize ?? 25;

        const [items, total] = await Promise.all([
            this.gradeModel.find(query).sort({ sortOrder: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean().exec(),
            this.gradeModel.countDocuments(query).exec(),
        ]);

        return { items: items.map(doc => this.toEntity(doc)), total, page, pageSize };
    }

    async create(entity: GradeEntity): Promise<GradeEntity> {
        const created = await this.gradeModel.create({
            tenantId: entity.tenantId,
            schoolIds: entity.schoolIds,
            name: entity.name,
            normalizedName: entity.normalizedName,
            code: entity.code,
            sortOrder: entity.sortOrder,
            status: entity.status,
            scopeKey: this.scopeKey(entity),
            archivedAt: entity.archivedAt ?? null,
        });
        return this.toEntity(created.toObject());
    }

    async update(entity: GradeEntity): Promise<GradeEntity> {
        const doc = await this.gradeModel
            .findOneAndUpdate(
                { _id: entity.id, tenantId: entity.tenantId },
                {
                    $set: {
                        schoolIds: entity.schoolIds,
                        name: entity.name,
                        normalizedName: entity.normalizedName,
                        code: entity.code,
                        sortOrder: entity.sortOrder,
                        status: entity.status,
                        scopeKey: this.scopeKey(entity),
                        archivedAt: entity.archivedAt ?? null,
                        updatedAt: new Date(),
                    },
                },
                { new: true },
            )
            .lean()
            .exec();
        if (!doc) {
            throw new Error('Grade not found');
        }
        return this.toEntity(doc);
    }

    async archive(tenantId: string, id: string, actorUserId?: string | null): Promise<void> {
        await this.gradeModel.updateOne(
            { _id: id, tenantId },
            { $set: { status: 'archived', archivedAt: new Date(), updatedBy: actorUserId ?? null } },
        ).exec();
    }

    async restore(tenantId: string, id: string, actorUserId?: string | null): Promise<void> {
        await this.gradeModel.updateOne(
            { _id: id, tenantId },
            { $set: { status: 'active', archivedAt: null, updatedBy: actorUserId ?? null } },
        ).exec();
    }

    async existsActiveByNameScope(input: {
        tenantId: string;
        scopeKey: string;
        normalizedName: string;
        excludeId?: string;
    }): Promise<boolean> {
        const query: Record<string, any> = {
            tenantId: input.tenantId,
            scopeKey: input.scopeKey,
            normalizedName: input.normalizedName,
            status: 'active',
        };
        if (input.excludeId) {
            query._id = { $ne: input.excludeId };
        }
        const doc = await this.gradeModel.findOne(query).lean().exec();
        return Boolean(doc);
    }

    async findConflictsByNameOverlap(input: {
        tenantId: string;
        normalizedName: string;
        schoolIds: string[];
        excludeId?: string;
    }): Promise<GradeEntity[]> {
        const query: Record<string, any> = {
            tenantId: input.tenantId,
            normalizedName: input.normalizedName,
            status: 'active',
            schoolIds: { $in: input.schoolIds },
        };
        if (input.excludeId) {
            query._id = { $ne: input.excludeId };
        }
        const docs = await this.gradeModel.find(query).lean().exec();
        return docs.map(doc => this.toEntity(doc));
    }

    private buildFilters(tenantId: string, filters: GradeListFilters): Record<string, any> {
        const query: Record<string, any> = { tenantId };
        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.schoolId) {
            query.schoolIds = filters.schoolId;
        }
        if (filters.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { code: { $regex: filters.search, $options: 'i' } },
            ];
        }
        return query;
    }

    private scopeKey(entity: GradeEntity): string {
        return `${entity.tenantId}:${entity.schoolIds.map(id => id.toString()).sort().join('-')}`;
    }

    private toEntity(doc: GradeDoc): GradeEntity {
        return new GradeEntity({
            id: doc._id.toString(),
            tenantId: doc.tenantId.toString(),
            schoolIds: doc.schoolIds?.map(id => id.toString()) ?? [],
            name: doc.name,
            normalizedName: doc.normalizedName,
            code: doc.code,
            sortOrder: doc.sortOrder ?? 0,
            status: doc.status ?? 'active',
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            archivedAt: doc.archivedAt ?? null,
        });
    }
}
