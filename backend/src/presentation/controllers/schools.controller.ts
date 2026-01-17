import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { TenantContext } from '../../common/tenant/tenant.context';
import { CreateSchoolUseCase, DeleteSchoolUseCase, GetSchoolsUseCase, UpdateSchoolUseCase } from '../../application/services/school';
import { CreateSchoolDto } from '../dtos/requests/schools/create-school.dto';
import { UpdateSchoolDto } from '../dtos/requests/schools/update-school.dto';
import { SchoolResponseDto } from '../dtos/responses/schools/school.response.dto';

@ApiTags('Schools')
@Controller('schools')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SchoolsController {
    constructor(
        private readonly getSchoolsUseCase: GetSchoolsUseCase,
        private readonly createSchoolUseCase: CreateSchoolUseCase,
        private readonly updateSchoolUseCase: UpdateSchoolUseCase,
        private readonly deleteSchoolUseCase: DeleteSchoolUseCase,
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
            address: dto.address,
            contact: dto.contact,
            settings: dto.settings,
        });
        return SchoolResponseDto.fromDomain(school);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a school for current tenant' })
    @ApiResponse({ status: 200, type: SchoolResponseDto })
    async update(@Param('id') id: string, @Body() dto: UpdateSchoolDto): Promise<SchoolResponseDto> {
        const school = await this.updateSchoolUseCase.execute({
            tenantId: this.tenantContext.tenantId,
            id,
            name: dto.name,
            code: dto.code,
            type: dto.type,
            status: dto.status,
            domain: dto.domain,
            address: dto.address,
            contact: dto.contact,
            settings: dto.settings,
        });
        return SchoolResponseDto.fromDomain(school);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a school for current tenant' })
    @ApiResponse({ status: 204 })
    @HttpCode(204)
    async delete(@Param('id') id: string): Promise<void> {
        await this.deleteSchoolUseCase.execute(this.tenantContext.tenantId, id);
    }
}
