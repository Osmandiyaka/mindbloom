import {
    Body,
    Controller,
    Get,
    HttpException,
    Param,
    Patch,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { ClassesSectionsDomainError } from '../../application/classes-sections/errors';
import { GetSectionUseCase } from '../../application/classes-sections/use-cases/get-section.use-case';
import { UpdateSectionUseCase } from '../../application/classes-sections/use-cases/update-section.use-case';
import { ArchiveSectionUseCase } from '../../application/classes-sections/use-cases/archive-section.use-case';
import { RestoreSectionUseCase } from '../../application/classes-sections/use-cases/restore-section.use-case';
import { UpdateSectionDto } from '../dtos/requests/classes-sections/update-section.dto';
import { ArchiveRequestDto } from '../dtos/requests/classes-sections/archive-request.dto';

@Controller('sections')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SectionsController {
    constructor(
        private readonly getSectionUseCase: GetSectionUseCase,
        private readonly updateSectionUseCase: UpdateSectionUseCase,
        private readonly archiveSectionUseCase: ArchiveSectionUseCase,
        private readonly restoreSectionUseCase: RestoreSectionUseCase,
    ) {}

    @Get(':id')
    async getOne(@Request() req, @Param('id') id: string) {
        try {
            const data = await this.getSectionUseCase.execute(req.user.tenantId, id);
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Patch(':id')
    async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateSectionDto) {
        try {
            const data = await this.updateSectionUseCase.execute({
                tenantId: req.user.tenantId,
                sectionId: id,
                name: dto.name,
                code: dto.code,
                capacity: dto.capacity,
                sortOrder: dto.sortOrder,
                status: dto.status,
                actorUserId: req.user.id,
            });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Post(':id/archive')
    async archive(@Request() req, @Param('id') id: string, @Body() dto: ArchiveRequestDto) {
        try {
            const data = await this.archiveSectionUseCase.execute({
                tenantId: req.user.tenantId,
                sectionId: id,
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
            const data = await this.restoreSectionUseCase.execute({
                tenantId: req.user.tenantId,
                sectionId: id,
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
