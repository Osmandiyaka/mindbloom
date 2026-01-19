import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClassEntity } from '../../../../domain/academics/entities/class.entity';
import {
    ClassListFilters,
    ClassSort,
    IClassReadModelPort,
    IClassRepository,
    PaginatedResult,
    PaginationInput,
} from '../../../../domain/ports/out/class-repository.port';

type ClassDoc = {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId;
    schoolIds: Types.ObjectId[];
    academicYearId?: Types.ObjectId;
    gradeId?: Types.ObjectId;
    name: string;
    normalizedName: string;
    code?: string;
    status: 'active' | 'archived';
    sortOrder: number;
    scopeKey: string;
    archivedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
};

@Injectable()
export class MongooseClassRepository implements IClassRepository, IClassReadModelPort {
    constructor(
        @InjectModel('Class') private readonly classModel: Model<ClassDoc>,
        @InjectModel('Section') private readonly sectionModel: Model<any>,
    ) {}

    async findById(tenantId: string, id: string): Promise<ClassEntity | null> {
        const doc = await this.classModel.findOne({ _id: id, tenantId }).lean().exec();
        return doc ? this.toEntity(doc) : null;
    }

    async list(
        tenantId: string,
        filters: ClassListFilters,
        pagination: PaginationInput,
        sort?: ClassSort,
    ): Promise<PaginatedResult<ClassEntity>> {
        const query = this.buildFilters(tenantId, filters);
        const page = pagination.page ?? 1;
        const pageSize = pagination.pageSize ?? 25;
        const sortSpec = this.buildSort(sort);

        const [items, total] = await Promise.all([
            this.classModel.find(query).sort(sortSpec).skip((page - 1) * pageSize).limit(pageSize).lean().exec(),
            this.classModel.countDocuments(query).exec(),
        ]);

        return {
            items: items.map(doc => this.toEntity(doc)),
            total,
            page,
            pageSize,
        };
    }

    async listWithCounts(
        tenantId: string,
        filters: ClassListFilters,
        pagination: PaginationInput,
        sort?: ClassSort,
    ): Promise<PaginatedResult<ClassEntity & { sectionsCount: number }>> {
        const query = this.buildFilters(tenantId, filters);
        const page = pagination.page ?? 1;
        const pageSize = pagination.pageSize ?? 25;
        const sortSpec = this.buildSort(sort);

        const schoolIdMatch =
            filters.schoolId && Types.ObjectId.isValid(filters.schoolId)
                ? new Types.ObjectId(filters.schoolId)
                : null;

        const pipeline: any[] = [
            { $match: query },
            { $sort: sortSpec },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            {
                $lookup: {
                    from: 'sections',
                    let: { classId: '$_id', tenantId: '$tenantId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$classId', '$$classId'] },
                                        { $eq: ['$tenantId', '$$tenantId'] },
                                        { $eq: ['$status', 'active'] },
                                    ],
                                },
                            },
                        },
                        ...(schoolIdMatch ? [{ $match: { schoolId: schoolIdMatch } }] : []),
                    ],
                    as: 'sections',
                },
            },
            { $addFields: { sectionsCount: { $size: '$sections' } } },
            { $project: { sections: 0 } },
        ];

        const [items, total] = await Promise.all([
            this.classModel.aggregate(pipeline).exec(),
            this.classModel.countDocuments(query).exec(),
        ]);

        return {
            items: items.map((doc: any) => Object.assign(this.toEntity(doc), { sectionsCount: doc.sectionsCount ?? 0 })),
            total,
            page,
            pageSize,
        };
    }

    async countSectionsByClass(tenantId: string, classId: string): Promise<number> {
        return this.sectionModel.countDocuments({ tenantId, classId, status: 'active' }).exec();
    }

    async listByGradeId(tenantId: string, gradeId: string, status?: 'active' | 'archived'): Promise<ClassEntity[]> {
        const query: Record<string, any> = { tenantId, gradeId };
        if (status) {
            query.status = status;
        }
        const docs = await this.classModel.find(query).lean().exec();
        return docs.map(doc => this.toEntity(doc));
    }

    async create(entity: ClassEntity): Promise<ClassEntity> {
        const created = await this.classModel.create({
            tenantId: entity.tenantId,
            schoolIds: entity.schoolIds,
            academicYearId: entity.academicYearId,
            gradeId: entity.gradeId,
            name: entity.name,
            normalizedName: entity.normalizedName,
            code: entity.code,
            status: entity.status,
            sortOrder: entity.sortOrder,
            scopeKey: this.scopeKey(entity),
            archivedAt: entity.archivedAt ?? null,
        });
        return this.toEntity(created.toObject());
    }

    async update(entity: ClassEntity): Promise<ClassEntity> {
        const doc = await this.classModel
            .findOneAndUpdate(
                { _id: entity.id, tenantId: entity.tenantId },
                {
                    $set: {
                        schoolIds: entity.schoolIds,
                        academicYearId: entity.academicYearId,
                        gradeId: entity.gradeId,
                        name: entity.name,
                        normalizedName: entity.normalizedName,
                        code: entity.code,
                        status: entity.status,
                        sortOrder: entity.sortOrder,
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
            throw new Error('Class not found');
        }
        return this.toEntity(doc);
    }

    async archive(tenantId: string, id: string, actorUserId?: string | null): Promise<void> {
        await this.classModel.updateOne(
            { _id: id, tenantId },
            { $set: { status: 'archived', archivedAt: new Date(), updatedBy: actorUserId ?? null } },
        ).exec();
    }

    async restore(tenantId: string, id: string, actorUserId?: string | null): Promise<void> {
        await this.classModel.updateOne(
            { _id: id, tenantId },
            { $set: { status: 'active', archivedAt: null, updatedBy: actorUserId ?? null } },
        ).exec();
    }

    async existsActiveByNameScope(input: {
        tenantId: string;
        academicYearId?: string | null;
        gradeId?: string | null;
        scopeKey: string;
        normalizedName: string;
        excludeId?: string;
    }): Promise<boolean> {
        const query: Record<string, any> = {
            tenantId: input.tenantId,
            academicYearId: input.academicYearId ?? null,
            gradeId: input.gradeId ?? null,
            scopeKey: input.scopeKey,
            normalizedName: input.normalizedName,
            status: 'active',
        };
        if (input.excludeId) {
            query._id = { $ne: input.excludeId };
        }
        const doc = await this.classModel.findOne(query).lean().exec();
        return Boolean(doc);
    }

    async findConflictsByNameOverlap(input: {
        tenantId: string;
        academicYearId?: string | null;
        gradeId?: string | null;
        normalizedName: string;
        schoolIds: string[];
        excludeId?: string;
    }): Promise<ClassEntity[]> {
        const query: Record<string, any> = {
            tenantId: input.tenantId,
            academicYearId: input.academicYearId ?? null,
            gradeId: input.gradeId ?? null,
            normalizedName: input.normalizedName,
            status: 'active',
            schoolIds: { $in: input.schoolIds },
        };
        if (input.excludeId) {
            query._id = { $ne: input.excludeId };
        }
        const docs = await this.classModel.find(query).lean().exec();
        return docs.map(doc => this.toEntity(doc));
    }

    async updateSortOrders(tenantId: string, updates: Array<{ id: string; sortOrder: number }>): Promise<void> {
        if (!updates.length) return;
        await this.classModel.bulkWrite(
            updates.map(update => ({
                updateOne: {
                    filter: { _id: update.id, tenantId },
                    update: { $set: { sortOrder: update.sortOrder } },
                },
            })),
        );
    }

    private buildFilters(tenantId: string, filters: ClassListFilters): Record<string, any> {
        const query: Record<string, any> = { tenantId };
        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.schoolId) {
            query.schoolIds = filters.schoolId;
        }
        if (filters.academicYearId) {
            query.academicYearId = filters.academicYearId;
        }
        if (filters.gradeId) {
            query.gradeId = filters.gradeId;
        }
        if (filters.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { code: { $regex: filters.search, $options: 'i' } },
            ];
        }
        return query;
    }

    private buildSort(sort?: ClassSort): Record<string, 1 | -1> {
        if (!sort?.field) {
            return { sortOrder: 1 };
        }
        const direction = sort.direction === 'desc' ? -1 : 1;
        return { [sort.field]: direction } as Record<string, 1 | -1>;
    }

    private scopeKey(entity: ClassEntity): string {
        return `${entity.tenantId}:${entity.schoolIds.map(id => id.toString()).sort().join('-')}`;
    }

    private toEntity(doc: ClassDoc & { sectionsCount?: number }): ClassEntity {
        return new ClassEntity({
            id: doc._id.toString(),
            tenantId: doc.tenantId.toString(),
            schoolIds: doc.schoolIds?.map(id => id.toString()) ?? [],
            academicYearId: doc.academicYearId?.toString(),
            gradeId: doc.gradeId?.toString(),
            name: doc.name,
            normalizedName: doc.normalizedName,
            code: doc.code,
            status: doc.status ?? 'active',
            sortOrder: doc.sortOrder ?? 0,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            archivedAt: doc.archivedAt ?? null,
        });
    }
}
