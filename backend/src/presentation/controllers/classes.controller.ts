import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Request,
    UseGuards,
    HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { ClassesSectionsDomainError } from '../../application/classes-sections/errors';
import { ListClassesUseCase } from '../../application/classes-sections/use-cases/list-classes.use-case';
import { GetClassUseCase } from '../../application/classes-sections/use-cases/get-class.use-case';
import { CreateClassUseCase } from '../../application/classes-sections/use-cases/create-class.use-case';
import { UpdateClassUseCase } from '../../application/classes-sections/use-cases/update-class.use-case';
import { ArchiveClassImpactUseCase } from '../../application/classes-sections/use-cases/archive-class-impact.use-case';
import { ArchiveClassUseCase } from '../../application/classes-sections/use-cases/archive-class.use-case';
import { RestoreClassUseCase } from '../../application/classes-sections/use-cases/restore-class.use-case';
import { ReorderClassesUseCase } from '../../application/classes-sections/use-cases/reorder-classes.use-case';
import { ListSectionsByClassUseCase } from '../../application/classes-sections/use-cases/list-sections-by-class.use-case';
import { CreateSectionUseCase } from '../../application/classes-sections/use-cases/create-section.use-case';
import { CreateClassDto } from '../dtos/requests/classes-sections/create-class.dto';
import { UpdateClassDto } from '../dtos/requests/classes-sections/update-class.dto';
import { ReorderClassesDto } from '../dtos/requests/classes-sections/reorder-classes.dto';
import { ArchiveRequestDto } from '../dtos/requests/classes-sections/archive-request.dto';
import { CreateSectionDto } from '../dtos/requests/classes-sections/create-section.dto';

@Controller('classes')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ClassesController {
    constructor(
        private readonly listClassesUseCase: ListClassesUseCase,
        private readonly getClassUseCase: GetClassUseCase,
        private readonly createClassUseCase: CreateClassUseCase,
        private readonly updateClassUseCase: UpdateClassUseCase,
        private readonly archiveClassImpactUseCase: ArchiveClassImpactUseCase,
        private readonly archiveClassUseCase: ArchiveClassUseCase,
        private readonly restoreClassUseCase: RestoreClassUseCase,
        private readonly reorderClassesUseCase: ReorderClassesUseCase,
        private readonly listSectionsByClassUseCase: ListSectionsByClassUseCase,
        private readonly createSectionUseCase: CreateSectionUseCase,
    ) {}

    @Get()
    async list(
        @Request() req,
        @Query('schoolId') schoolId?: string,
        @Query('academicYearId') academicYearId?: string,
        @Query('gradeId') gradeId?: string,
        @Query('status') status?: 'active' | 'archived',
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('includeCounts') includeCounts?: string,
    ) {
        try {
            const result = await this.listClassesUseCase.execute({
                tenantId: req.user.tenantId,
                schoolId,
                academicYearId,
                gradeId,
                status,
                search,
                page: page ? Number(page) : undefined,
                pageSize: pageSize ? Number(pageSize) : undefined,
                includeCounts: includeCounts === 'true',
            });
            return { data: result.items, meta: { total: result.total, page: result.page, pageSize: result.pageSize } };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Get(':id')
    async getOne(@Request() req, @Param('id') id: string) {
        try {
            const data = await this.getClassUseCase.execute(req.user.tenantId, id);
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post()
    async create(@Request() req, @Body() dto: CreateClassDto) {
        try {
            const data = await this.createClassUseCase.execute({
                tenantId: req.user.tenantId,
                schoolIds: dto.schoolIds,
                academicYearId: dto.academicYearId,
                gradeId: dto.gradeId,
                name: dto.name,
                code: dto.code,
                sortOrder: dto.sortOrder,
                actorUserId: req.user.id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Patch('reorder')
    async reorder(@Request() req, @Body() dto: ReorderClassesDto) {
        try {
            const data = await this.reorderClassesUseCase.execute({
                tenantId: req.user.tenantId,
                updates: dto.updates,
                actorUserId: req.user.id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Patch(':id')
    async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateClassDto) {
        try {
            const data = await this.updateClassUseCase.execute({
                tenantId: req.user.tenantId,
                classId: id,
                schoolIds: dto.schoolIds,
                academicYearId: dto.academicYearId,
                gradeId: dto.gradeId,
                name: dto.name,
                code: dto.code,
                sortOrder: dto.sortOrder,
                status: dto.status,
                actorUserId: req.user.id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post(':id/archive/impact')
    async archiveImpact(@Request() req, @Param('id') id: string) {
        try {
            const data = await this.archiveClassImpactUseCase.execute({
                tenantId: req.user.tenantId,
                classId: id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post(':id/archive')
    async archive(@Request() req, @Param('id') id: string, @Body() dto: ArchiveRequestDto) {
        try {
            const data = await this.archiveClassUseCase.execute({
                tenantId: req.user.tenantId,
                classId: id,
                confirmationText: dto?.confirmationText,
                actorUserId: req.user.id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post(':id/restore')
    async restore(@Request() req, @Param('id') id: string) {
        try {
            const data = await this.restoreClassUseCase.execute({
                tenantId: req.user.tenantId,
                classId: id,
                actorUserId: req.user.id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Get(':classId/sections')
    async listSections(
        @Request() req,
        @Param('classId') classId: string,
        @Query('status') status?: 'active' | 'archived',
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
    ) {
        try {
            const result = await this.listSectionsByClassUseCase.execute({
                tenantId: req.user.tenantId,
                classId,
                status,
                search,
                page: page ? Number(page) : undefined,
                pageSize: pageSize ? Number(pageSize) : undefined,
            });
            return { data: result.items, meta: { total: result.total, page: result.page, pageSize: result.pageSize } };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post(':classId/sections')
    async createSection(@Request() req, @Param('classId') classId: string, @Body() dto: CreateSectionDto) {
        try {
            const data = await this.createSectionUseCase.execute({
                tenantId: req.user.tenantId,
                classId,
                name: dto.name,
                code: dto.code,
                capacity: dto.capacity ?? undefined,
                sortOrder: dto.sortOrder,
                actorUserId: req.user.id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    private handleError(err: any) {
        if (err instanceof ClassesSectionsDomainError) {
            throw new HttpException({ code: err.code, message: err.message, details: err.details }, err.status);
        }
        throw err;
    }
}
