import {
    Body,
    Controller,
    Get,
    HttpException,
    Patch,
    Request,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { ClassesSectionsDomainError } from '../../application/classes-sections/errors';
import { GetClassConfigUseCase } from '../../application/classes-sections/use-cases/get-class-config.use-case';
import { UpdateClassConfigUseCase } from '../../application/classes-sections/use-cases/update-class-config.use-case';
import { UpdateClassConfigDto } from '../dtos/requests/classes-sections/update-class-config.dto';

@Controller('classConfig')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ClassConfigController {
    constructor(
        private readonly getClassConfigUseCase: GetClassConfigUseCase,
        private readonly updateClassConfigUseCase: UpdateClassConfigUseCase,
    ) {}

    @Get()
    async get(@Request() req) {
        try {
            const data = await this.getClassConfigUseCase.execute({ tenantId: req.user.tenantId });
            return { data };
        } catch (err) {
            this.handleError(err);
        }
    }

    @Patch()
    async update(@Request() req, @Body() dto: UpdateClassConfigDto) {
        try {
            const data = await this.updateClassConfigUseCase.execute({
                tenantId: req.user.tenantId,
                classesScope: dto.classesScope,
                requireGradeLink: dto.requireGradeLink,
                sectionUniquenessScope: dto.sectionUniquenessScope,
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
