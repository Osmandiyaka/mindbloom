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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { ClassesSectionsDomainError } from '../../application/classes-sections/errors';
import { ListGradesUseCase } from '../../application/classes-sections/use-cases/list-grades.use-case';
import { CreateGradeUseCase } from '../../application/classes-sections/use-cases/create-grade.use-case';
import { UpdateGradeUseCase } from '../../application/classes-sections/use-cases/update-grade.use-case';
import { ArchiveGradeImpactUseCase } from '../../application/classes-sections/use-cases/archive-grade-impact.use-case';
import { ArchiveGradeUseCase } from '../../application/classes-sections/use-cases/archive-grade.use-case';
import { RestoreGradeUseCase } from '../../application/classes-sections/use-cases/restore-grade.use-case';
import { GetGradeUseCase } from '../../application/classes-sections/use-cases/get-grade.use-case';
import { CreateGradeDto } from '../dtos/requests/classes-sections/create-grade.dto';
import { UpdateGradeDto } from '../dtos/requests/classes-sections/update-grade.dto';
import { ArchiveRequestDto } from '../dtos/requests/classes-sections/archive-request.dto';
import { HttpException } from '@nestjs/common';

@Controller('grades')
@UseGuards(JwtAuthGuard, TenantGuard)
export class GradesController {
    constructor(
        private readonly listGradesUseCase: ListGradesUseCase,
        private readonly getGradeUseCase: GetGradeUseCase,
        private readonly createGradeUseCase: CreateGradeUseCase,
        private readonly updateGradeUseCase: UpdateGradeUseCase,
        private readonly archiveGradeImpactUseCase: ArchiveGradeImpactUseCase,
        private readonly archiveGradeUseCase: ArchiveGradeUseCase,
        private readonly restoreGradeUseCase: RestoreGradeUseCase,
    ) {}

    @Get()
    async list(
        @Request() req,
        @Query('schoolId') schoolId?: string,
        @Query('status') status?: 'active' | 'archived',
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
    ) {
        try {
            const result = await this.listGradesUseCase.execute({
                tenantId: req.user.tenantId,
                schoolId,
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

    @Get(':id')
    async getOne(@Request() req, @Param('id') id: string) {
        try {
            const data = await this.getGradeUseCase.execute(req.user.tenantId, id);
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post()
    async create(@Request() req, @Body() dto: CreateGradeDto) {
        try {
            const data = await this.createGradeUseCase.execute({
                tenantId: req.user.tenantId,
                schoolIds: dto.schoolIds,
                name: dto.name,
                code: dto.code,
                actorUserId: req.user.id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Patch(':id')
    async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateGradeDto) {
        try {
            const data = await this.updateGradeUseCase.execute({
                tenantId: req.user.tenantId,
                gradeId: id,
                schoolIds: dto.schoolIds,
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
            const data = await this.archiveGradeImpactUseCase.execute({
                tenantId: req.user.tenantId,
                gradeId: id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post(':id/archive')
    async archive(@Request() req, @Param('id') id: string, @Body() dto: ArchiveRequestDto) {
        try {
            const data = await this.archiveGradeUseCase.execute({
                tenantId: req.user.tenantId,
                gradeId: id,
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
            const data = await this.restoreGradeUseCase.execute({
                tenantId: req.user.tenantId,
                gradeId: id,
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
