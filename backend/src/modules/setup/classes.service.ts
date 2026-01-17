import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TenantContext } from '../../common/tenant/tenant.context';
import { ClassEntity } from '../../domain/academics/entities/class.entity';
import { SectionEntity } from '../../domain/academics/entities/section.entity';
import { CLASS_REPOSITORY, IClassRepository } from '../../domain/ports/out/class-repository.port';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class ClassesService {
    constructor(
        @Inject(CLASS_REPOSITORY) private readonly classRepository: IClassRepository,
        private readonly tenantContext: TenantContext,
    ) { }

    async listClasses() {
        const tenantId = this.tenantContext.tenantId;
        const classes = await this.classRepository.listClasses(tenantId);
        return classes.map(item => item.toPrimitives());
    }

    async listSections(classId?: string) {
        const tenantId = this.tenantContext.tenantId;
        const sections = await this.classRepository.listSections(tenantId, classId);
        return sections.map(item => item.toPrimitives());
    }

    async createClass(dto: CreateClassDto) {
        const tenantId = this.tenantContext.tenantId;
        const name = this.normalizeText(dto.name);
        if (!name) throw new BadRequestException('Class name is required');
        const sortOrder = dto.sortOrder ?? (await this.classRepository.countClasses(tenantId)) + 1;
        const created = new ClassEntity({
            id: '',
            tenantId,
            name,
            code: this.normalizeText(dto.code) || undefined,
            levelType: this.normalizeText(dto.levelType) || undefined,
            sortOrder,
            active: dto.active ?? true,
            schoolIds: dto.schoolIds ?? null,
            notes: this.normalizeText(dto.notes) || undefined,
        });
        const saved = await this.classRepository.createClass(created);
        return saved.toPrimitives();
    }

    async updateClass(id: string, dto: UpdateClassDto) {
        const tenantId = this.tenantContext.tenantId;
        const current = await this.classRepository.findClassById(id, tenantId);
        if (!current) throw new NotFoundException('Class not found');
        if (dto.name !== undefined && !this.normalizeText(dto.name)) {
            throw new BadRequestException('Class name is required');
        }
        const updatedEntity = current.withUpdates({
            name: dto.name !== undefined ? this.normalizeText(dto.name) || current.name : current.name,
            code: dto.code !== undefined ? this.normalizeText(dto.code) || undefined : current.code,
            levelType: dto.levelType !== undefined ? this.normalizeText(dto.levelType) || undefined : current.levelType,
            sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : current.sortOrder,
            active: dto.active !== undefined ? dto.active : current.active,
            schoolIds: dto.schoolIds !== undefined ? dto.schoolIds : current.schoolIds,
            notes: dto.notes !== undefined ? this.normalizeText(dto.notes) || undefined : current.notes,
        });
        const saved = await this.classRepository.updateClass(updatedEntity);
        return saved.toPrimitives();
    }

    async deleteClass(id: string) {
        const tenantId = this.tenantContext.tenantId;
        const current = await this.classRepository.findClassById(id, tenantId);
        if (!current) throw new NotFoundException('Class not found');
        await this.classRepository.deleteSectionsByClassId(id, tenantId);
        await this.classRepository.deleteClass(id, tenantId);
    }

    async createSection(dto: CreateSectionDto) {
        const tenantId = this.tenantContext.tenantId;
        if (!dto.classId) throw new BadRequestException('Class is required');
        const name = this.normalizeText(dto.name);
        if (!name) throw new BadRequestException('Section name is required');
        const classExists = await this.classRepository.findClassById(dto.classId, tenantId);
        if (!classExists) throw new BadRequestException('Class not found');
        const sortOrder = dto.sortOrder ?? (await this.classRepository.countSections(tenantId, dto.classId)) + 1;
        const created = new SectionEntity({
            id: '',
            tenantId,
            classId: dto.classId,
            name,
            code: this.normalizeText(dto.code) || undefined,
            capacity: dto.capacity ?? undefined,
            homeroomTeacherId: dto.homeroomTeacherId || undefined,
            active: dto.active ?? true,
            sortOrder,
        });
        const saved = await this.classRepository.createSection(created);
        return saved.toPrimitives();
    }

    async updateSection(id: string, dto: UpdateSectionDto) {
        const tenantId = this.tenantContext.tenantId;
        const current = await this.classRepository.findSectionById(id, tenantId);
        if (!current) throw new NotFoundException('Section not found');
        if (dto.name !== undefined && !this.normalizeText(dto.name)) {
            throw new BadRequestException('Section name is required');
        }
        if (dto.classId !== undefined) {
            const classExists = await this.classRepository.findClassById(dto.classId, tenantId);
            if (!classExists) throw new BadRequestException('Class not found');
        }
        const updatedEntity = current.withUpdates({
            classId: dto.classId !== undefined ? dto.classId : current.classId,
            name: dto.name !== undefined ? this.normalizeText(dto.name) || current.name : current.name,
            code: dto.code !== undefined ? this.normalizeText(dto.code) || undefined : current.code,
            capacity: dto.capacity !== undefined ? dto.capacity ?? undefined : current.capacity,
            homeroomTeacherId: dto.homeroomTeacherId !== undefined
                ? dto.homeroomTeacherId || undefined
                : current.homeroomTeacherId,
            active: dto.active !== undefined ? dto.active : current.active,
            sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : current.sortOrder,
        });
        const saved = await this.classRepository.updateSection(updatedEntity);
        return saved.toPrimitives();
    }

    async deleteSection(id: string) {
        const tenantId = this.tenantContext.tenantId;
        const current = await this.classRepository.findSectionById(id, tenantId);
        if (!current) throw new NotFoundException('Section not found');
        await this.classRepository.deleteSection(id, tenantId);
    }

    private normalizeText(value?: string | null): string | null {
        if (value === undefined || value === null) return null;
        const trimmed = value.trim();
        return trimmed ? trimmed : null;
    }
}
