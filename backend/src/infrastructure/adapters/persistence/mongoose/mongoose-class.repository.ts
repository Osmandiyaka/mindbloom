import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TenantScopedRepository } from '../../../../common/tenant/tenant-scoped.repository';
import { TenantContext } from '../../../../common/tenant/tenant.context';
import { ClassEntity } from '../../../../domain/academics/entities/class.entity';
import { SectionEntity } from '../../../../domain/academics/entities/section.entity';
import { IClassRepository } from '../../../../domain/ports/out/class-repository.port';

type ClassDefinitionDoc = {
    _id: Types.ObjectId;
    tenantId: string;
    name: string;
    code?: string;
    levelType?: string;
    sortOrder: number;
    active: boolean;
    schoolIds: string[] | null;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
};

type SectionDefinitionDoc = {
    _id: Types.ObjectId;
    tenantId: string;
    classId: string;
    name: string;
    code?: string;
    capacity?: number;
    homeroomTeacherId?: string;
    active: boolean;
    sortOrder: number;
    createdAt?: Date;
    updatedAt?: Date;
};

@Injectable()
export class MongooseClassRepository
    extends TenantScopedRepository<ClassDefinitionDoc, ClassEntity>
    implements IClassRepository {
    constructor(
        @InjectModel('ClassDefinition') private readonly classModel: Model<ClassDefinitionDoc>,
        @InjectModel('SectionDefinition') private readonly sectionModel: Model<SectionDefinitionDoc>,
        tenantContext: TenantContext,
    ) {
        super(tenantContext);
    }

    async listClasses(tenantId: string): Promise<ClassEntity[]> {
        const filter = this.withTenantFilter({}, tenantId);
        const docs = await this.classModel.find(filter).sort({ sortOrder: 1 }).lean().exec();
        return docs.map(doc => this.toClassEntity(doc));
    }

    async findClassById(id: string, tenantId: string): Promise<ClassEntity | null> {
        const filter = this.withTenantFilter({ _id: id }, tenantId);
        const doc = await this.classModel.findOne(filter).lean().exec();
        return doc ? this.toClassEntity(doc) : null;
    }

    async createClass(entity: ClassEntity): Promise<ClassEntity> {
        const tenantId = this.requireTenant(entity.tenantId);
        const created = new this.classModel({
            tenantId,
            name: entity.name,
            code: entity.code,
            levelType: entity.levelType,
            sortOrder: entity.sortOrder,
            active: entity.active,
            schoolIds: entity.schoolIds,
            notes: entity.notes,
        });
        const saved = await created.save();
        return this.toClassEntity(saved.toObject());
    }

    async updateClass(entity: ClassEntity): Promise<ClassEntity> {
        const filter = this.withTenantFilter({ _id: entity.id }, entity.tenantId);
        const doc = await this.classModel
            .findOneAndUpdate(
                filter,
                {
                    $set: {
                        name: entity.name,
                        code: entity.code,
                        levelType: entity.levelType,
                        sortOrder: entity.sortOrder,
                        active: entity.active,
                        schoolIds: entity.schoolIds,
                        notes: entity.notes,
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
        return this.toClassEntity(doc);
    }

    async deleteClass(id: string, tenantId: string): Promise<void> {
        const filter = this.withTenantFilter({ _id: id }, tenantId);
        await this.classModel.deleteOne(filter).exec();
    }

    async countClasses(tenantId: string): Promise<number> {
        const filter = this.withTenantFilter({}, tenantId);
        return this.classModel.countDocuments(filter).exec();
    }

    async listSections(tenantId: string, classId?: string): Promise<SectionEntity[]> {
        const baseFilter: Record<string, unknown> = {};
        if (classId) {
            baseFilter.classId = classId;
        }
        const filter = this.withTenantFilter(baseFilter, tenantId);
        const docs = await this.sectionModel.find(filter).sort({ sortOrder: 1 }).lean().exec();
        return docs.map(doc => this.toSectionEntity(doc));
    }

    async findSectionById(id: string, tenantId: string): Promise<SectionEntity | null> {
        const filter = this.withTenantFilter({ _id: id }, tenantId);
        const doc = await this.sectionModel.findOne(filter).lean().exec();
        return doc ? this.toSectionEntity(doc) : null;
    }

    async createSection(entity: SectionEntity): Promise<SectionEntity> {
        const tenantId = this.requireTenant(entity.tenantId);
        const created = new this.sectionModel({
            tenantId,
            classId: entity.classId,
            name: entity.name,
            code: entity.code,
            capacity: entity.capacity,
            homeroomTeacherId: entity.homeroomTeacherId,
            active: entity.active,
            sortOrder: entity.sortOrder,
        });
        const saved = await created.save();
        return this.toSectionEntity(saved.toObject());
    }

    async updateSection(entity: SectionEntity): Promise<SectionEntity> {
        const filter = this.withTenantFilter({ _id: entity.id }, entity.tenantId);
        const doc = await this.sectionModel
            .findOneAndUpdate(
                filter,
                {
                    $set: {
                        classId: entity.classId,
                        name: entity.name,
                        code: entity.code,
                        capacity: entity.capacity,
                        homeroomTeacherId: entity.homeroomTeacherId,
                        active: entity.active,
                        sortOrder: entity.sortOrder,
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
        return this.toSectionEntity(doc);
    }

    async deleteSection(id: string, tenantId: string): Promise<void> {
        const filter = this.withTenantFilter({ _id: id }, tenantId);
        await this.sectionModel.deleteOne(filter).exec();
    }

    async deleteSectionsByClassId(classId: string, tenantId: string): Promise<number> {
        const filter = this.withTenantFilter({ classId }, tenantId);
        const result = await this.sectionModel.deleteMany(filter).exec();
        return result.deletedCount ?? 0;
    }

    async countSections(tenantId: string, classId: string): Promise<number> {
        const filter = this.withTenantFilter({ classId }, tenantId);
        return this.sectionModel.countDocuments(filter).exec();
    }

    private toClassEntity(doc: ClassDefinitionDoc): ClassEntity {
        return new ClassEntity({
            id: doc._id.toString(),
            tenantId: doc.tenantId,
            name: doc.name,
            code: doc.code,
            levelType: doc.levelType,
            sortOrder: doc.sortOrder ?? 0,
            active: doc.active ?? true,
            schoolIds: doc.schoolIds ?? null,
            notes: doc.notes,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }

    private toSectionEntity(doc: SectionDefinitionDoc): SectionEntity {
        return new SectionEntity({
            id: doc._id.toString(),
            tenantId: doc.tenantId,
            classId: doc.classId,
            name: doc.name,
            code: doc.code,
            capacity: doc.capacity,
            homeroomTeacherId: doc.homeroomTeacherId,
            active: doc.active ?? true,
            sortOrder: doc.sortOrder ?? 0,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }
}
