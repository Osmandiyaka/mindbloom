import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TenantContext } from '../../common/tenant/tenant.context';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class ClassesService {
    constructor(
        @InjectModel('ClassDefinition') private classModel: Model<any>,
        @InjectModel('SectionDefinition') private sectionModel: Model<any>,
        private readonly tenantContext: TenantContext,
    ) { }

    async listClasses() {
        const tenantId = this.tenantContext.tenantId;
        return this.classModel.find({ tenantId }).sort({ sortOrder: 1 }).lean().exec();
    }

    async listSections(classId?: string) {
        const tenantId = this.tenantContext.tenantId;
        const filter: any = { tenantId };
        if (classId) filter.classId = classId;
        return this.sectionModel.find(filter).sort({ sortOrder: 1 }).lean().exec();
    }

    async createClass(dto: CreateClassDto) {
        const tenantId = this.tenantContext.tenantId;
        if (!dto.name?.trim()) throw new BadRequestException('Class name is required');
        const sortOrder = dto.sortOrder ?? (await this.classModel.countDocuments({ tenantId })) + 1;
        const created = new this.classModel({
            tenantId,
            name: dto.name.trim(),
            code: dto.code?.trim() || undefined,
            levelType: dto.levelType?.trim() || undefined,
            sortOrder,
            active: dto.active ?? true,
            schoolIds: dto.schoolIds ?? null,
            notes: dto.notes?.trim() || undefined,
        });
        return created.save();
    }

    async updateClass(id: string, dto: UpdateClassDto) {
        const tenantId = this.tenantContext.tenantId;
        const update: any = {};
        if (dto.name !== undefined) update.name = dto.name.trim();
        if (dto.code !== undefined) update.code = dto.code?.trim() || undefined;
        if (dto.levelType !== undefined) update.levelType = dto.levelType?.trim() || undefined;
        if (dto.sortOrder !== undefined) update.sortOrder = dto.sortOrder;
        if (dto.active !== undefined) update.active = dto.active;
        if (dto.schoolIds !== undefined) update.schoolIds = dto.schoolIds;
        if (dto.notes !== undefined) update.notes = dto.notes?.trim() || undefined;
        const updated = await this.classModel
            .findOneAndUpdate({ _id: id, tenantId }, { $set: update }, { new: true })
            .lean()
            .exec();
        if (!updated) throw new NotFoundException('Class not found');
        return updated;
    }

    async deleteClass(id: string) {
        const tenantId = this.tenantContext.tenantId;
        await this.sectionModel.deleteMany({ tenantId, classId: id });
        const result = await this.classModel.deleteOne({ _id: id, tenantId }).exec();
        if (!result.deletedCount) throw new NotFoundException('Class not found');
    }

    async createSection(dto: CreateSectionDto) {
        const tenantId = this.tenantContext.tenantId;
        if (!dto.classId) throw new BadRequestException('Class is required');
        if (!dto.name?.trim()) throw new BadRequestException('Section name is required');
        const classExists = await this.classModel.exists({ _id: dto.classId, tenantId });
        if (!classExists) throw new BadRequestException('Class not found');
        const sortOrder = dto.sortOrder ?? (await this.sectionModel.countDocuments({ tenantId, classId: dto.classId })) + 1;
        const created = new this.sectionModel({
            tenantId,
            classId: dto.classId,
            name: dto.name.trim(),
            code: dto.code?.trim() || undefined,
            capacity: dto.capacity ?? undefined,
            homeroomTeacherId: dto.homeroomTeacherId || undefined,
            active: dto.active ?? true,
            sortOrder,
        });
        return created.save();
    }

    async updateSection(id: string, dto: UpdateSectionDto) {
        const tenantId = this.tenantContext.tenantId;
        const update: any = {};
        if (dto.classId !== undefined) update.classId = dto.classId;
        if (dto.name !== undefined) update.name = dto.name.trim();
        if (dto.code !== undefined) update.code = dto.code?.trim() || undefined;
        if (dto.capacity !== undefined) update.capacity = dto.capacity ?? undefined;
        if (dto.homeroomTeacherId !== undefined) {
            update.homeroomTeacherId = dto.homeroomTeacherId || undefined;
        }
        if (dto.active !== undefined) update.active = dto.active;
        if (dto.sortOrder !== undefined) update.sortOrder = dto.sortOrder;
        const updated = await this.sectionModel
            .findOneAndUpdate({ _id: id, tenantId }, { $set: update }, { new: true })
            .lean()
            .exec();
        if (!updated) throw new NotFoundException('Section not found');
        return updated;
    }

    async deleteSection(id: string) {
        const tenantId = this.tenantContext.tenantId;
        const result = await this.sectionModel.deleteOne({ _id: id, tenantId }).exec();
        if (!result.deletedCount) throw new NotFoundException('Section not found');
    }
}
