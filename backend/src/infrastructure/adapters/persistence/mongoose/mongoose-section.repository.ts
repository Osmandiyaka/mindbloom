import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SectionEntity } from '../../../../domain/academics/entities/section.entity';
import { ISectionReadModelPort, ISectionRepository, SectionListFilters } from '../../../../domain/ports/out/section-repository.port';
import { PaginatedResult, PaginationInput } from '../../../../domain/ports/out/class-repository.port';

type SectionDoc = {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId;
    classId: Types.ObjectId;
    academicYearId?: Types.ObjectId;
    name: string;
    normalizedName: string;
    code?: string;
    capacity?: number;
    status: 'active' | 'archived';
    sortOrder: number;
    archivedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
};

@Injectable()
export class MongooseSectionRepository implements ISectionRepository, ISectionReadModelPort {
    constructor(@InjectModel('Section') private readonly sectionModel: Model<SectionDoc>) {}

    async findById(tenantId: string, id: string): Promise<SectionEntity | null> {
        const doc = await this.sectionModel.findOne({ _id: id, tenantId }).lean().exec();
        return doc ? this.toEntity(doc) : null;
    }

    async list(
        tenantId: string,
        filters: SectionListFilters,
        pagination: PaginationInput,
    ): Promise<PaginatedResult<SectionEntity>> {
        const query = this.buildFilters(tenantId, filters);
        const page = pagination.page ?? 1;
        const pageSize = pagination.pageSize ?? 25;

        const [items, total] = await Promise.all([
            this.sectionModel.find(query).sort({ sortOrder: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean().exec(),
            this.sectionModel.countDocuments(query).exec(),
        ]);

        return {
            items: items.map(doc => this.toEntity(doc)),
            total,
            page,
            pageSize,
        };
    }

    async listByClass(
        tenantId: string,
        classId: string,
        filters: SectionListFilters,
        pagination: PaginationInput,
    ): Promise<PaginatedResult<SectionEntity>> {
        return this.list(tenantId, { ...filters, classId }, pagination);
    }

    async create(entity: SectionEntity): Promise<SectionEntity> {
        const created = await this.sectionModel.create({
            tenantId: entity.tenantId,
            classId: entity.classId,
            academicYearId: entity.academicYearId,
            name: entity.name,
            normalizedName: entity.normalizedName,
            code: entity.code,
            capacity: entity.capacity,
            status: entity.status,
            sortOrder: entity.sortOrder,
            archivedAt: entity.archivedAt ?? null,
        });
        return this.toEntity(created.toObject());
    }

    async update(entity: SectionEntity): Promise<SectionEntity> {
        const doc = await this.sectionModel
            .findOneAndUpdate(
                { _id: entity.id, tenantId: entity.tenantId },
                {
                    $set: {
                        name: entity.name,
                        normalizedName: entity.normalizedName,
                        code: entity.code,
                        capacity: entity.capacity,
                        status: entity.status,
                        sortOrder: entity.sortOrder,
                        archivedAt: entity.archivedAt ?? null,
                        updatedAt: new Date(),
                    },
                },
                { new: true },
            )
            .lean()
            .exec();
        if (!doc) {
            throw new Error('Section not found');
        }
        return this.toEntity(doc);
    }

    async archive(tenantId: string, id: string, actorUserId?: string | null): Promise<void> {
        await this.sectionModel.updateOne(
            { _id: id, tenantId },
            { $set: { status: 'archived', archivedAt: new Date(), updatedBy: actorUserId ?? null } },
        ).exec();
    }

    async restore(tenantId: string, id: string, actorUserId?: string | null): Promise<void> {
        await this.sectionModel.updateOne(
            { _id: id, tenantId },
            { $set: { status: 'active', archivedAt: null, updatedBy: actorUserId ?? null } },
        ).exec();
    }

    async existsActiveByNameScope(input: {
        tenantId: string;
        classId: string;
        normalizedName: string;
        excludeId?: string;
    }): Promise<boolean> {
        const query: Record<string, any> = {
            tenantId: input.tenantId,
            classId: input.classId,
            normalizedName: input.normalizedName,
            status: 'active',
        };
        if (input.excludeId) {
            query._id = { $ne: input.excludeId };
        }
        const doc = await this.sectionModel.findOne(query).lean().exec();
        return Boolean(doc);
    }

    async archiveByClassId(tenantId: string, classId: string): Promise<number> {
        const result = await this.sectionModel.updateMany(
            { tenantId, classId },
            { $set: { status: 'archived', archivedAt: new Date() } },
        ).exec();
        return result.modifiedCount ?? 0;
    }

    async restoreByClassId(tenantId: string, classId: string): Promise<number> {
        const result = await this.sectionModel.updateMany(
            { tenantId, classId },
            { $set: { status: 'active', archivedAt: null } },
        ).exec();
        return result.modifiedCount ?? 0;
    }

    private buildFilters(tenantId: string, filters: SectionListFilters): Record<string, any> {
        const query: Record<string, any> = { tenantId };
        if (filters.classId) {
            query.classId = filters.classId;
        }
        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { code: { $regex: filters.search, $options: 'i' } },
            ];
        }
        return query;
    }

    private toEntity(doc: SectionDoc): SectionEntity {
        return new SectionEntity({
            id: doc._id.toString(),
            tenantId: doc.tenantId.toString(),
            classId: doc.classId.toString(),
            academicYearId: doc.academicYearId?.toString(),
            name: doc.name,
            normalizedName: doc.normalizedName,
            code: doc.code,
            capacity: doc.capacity,
            status: doc.status ?? 'active',
            sortOrder: doc.sortOrder ?? 0,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            archivedAt: doc.archivedAt ?? null,
        });
    }
}
