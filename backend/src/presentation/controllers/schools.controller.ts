import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { TenantContext } from '../../common/tenant/tenant.context';
import { CreateSchoolUseCase, GetSchoolsUseCase } from '../../application/services/school';
import { CreateSchoolDto } from '../dtos/requests/schools/create-school.dto';
import { SchoolResponseDto } from '../dtos/responses/schools/school.response.dto';

@ApiTags('Schools')
@Controller('schools')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SchoolsController {
    constructor(
        private readonly getSchoolsUseCase: GetSchoolsUseCase,
        private readonly createSchoolUseCase: CreateSchoolUseCase,
        private readonly tenantContext: TenantContext,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List schools for current tenant' })
    @ApiResponse({ status: 200, type: [SchoolResponseDto] })
    async list(): Promise<SchoolResponseDto[]> {
        const schools = await this.getSchoolsUseCase.execute(this.tenantContext.tenantId);
        return schools.map(SchoolResponseDto.fromDomain);
    }

    @Post()
    @ApiOperation({ summary: 'Create a school for current tenant' })
    @ApiResponse({ status: 201, type: SchoolResponseDto })
    async create(@Body() dto: CreateSchoolDto): Promise<SchoolResponseDto> {
        const school = await this.createSchoolUseCase.execute({
            tenantId: this.tenantContext.tenantId,
            name: dto.name,
            code: dto.code,
            type: dto.type,
            status: dto.status,
            domain: dto.domain,
        });
        return SchoolResponseDto.fromDomain(school);
    }
}
