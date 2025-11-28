import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetTenantBySubdomainUseCase, CreateTenantUseCase, GetTenantSettingsUseCase, UpdateTenantSettingsUseCase, UpdateTenantSettingsCommand } from '../../application/tenant/use-cases';
import { TenantResponseDto } from '../dtos/responses/tenant/tenant-response.dto';
import { CreateTenantDto } from '../dtos/requests/tenant/create-tenant.dto';
import { Public } from '../../common/tenant/public.decorator';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { TenantContext } from '../../common/tenant/tenant.context';
import { UpdateTenantSettingsDto } from '../dtos/requests/tenant/update-tenant-settings.dto';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantController {
    constructor(
        private readonly getTenantBySubdomainUseCase: GetTenantBySubdomainUseCase,
        private readonly createTenantUseCase: CreateTenantUseCase,
        private readonly getTenantSettingsUseCase: GetTenantSettingsUseCase,
        private readonly updateTenantSettingsUseCase: UpdateTenantSettingsUseCase,
        private readonly tenantContext: TenantContext,
    ) { }

    @Public()
    @Get('code/:code')
    @ApiOperation({ summary: 'Get tenant by code (subdomain)' })
    @ApiResponse({ status: 200, description: 'Tenant found', type: TenantResponseDto })
    @ApiResponse({ status: 404, description: 'Tenant not found' })
    async getTenantByCode(@Param('code') code: string): Promise<TenantResponseDto | null> {
        const tenant = await this.getTenantBySubdomainUseCase.execute(code);

        if (!tenant) {
            return null;
        }

        return TenantResponseDto.fromDomain(tenant);
    }

    @Public()
    @Post()
    @ApiOperation({ summary: 'Create a new tenant' })
    @ApiResponse({ status: 201, description: 'Tenant created successfully', type: TenantResponseDto })
    async createTenant(@Body() createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
        const tenant = await this.createTenantUseCase.execute({
            name: createTenantDto.name,
            subdomain: createTenantDto.subdomain,
            plan: createTenantDto.plan || 'free',
        });

        return TenantResponseDto.fromDomain(tenant);
    }

    @UseGuards(JwtAuthGuard, TenantGuard)
    @Get('settings')
    @ApiOperation({ summary: 'Get tenant settings for current tenant' })
    async getSettings() {
        const settings = await this.getTenantSettingsUseCase.execute(this.tenantContext.tenantId);
        return settings;
    }

    @UseGuards(JwtAuthGuard, TenantGuard)
    @Put('settings')
    @ApiOperation({ summary: 'Update tenant settings for current tenant' })
    async updateSettings(@Body() dto: UpdateTenantSettingsDto) {
        const command = new UpdateTenantSettingsCommand(this.tenantContext.tenantId, {
            customization: {
                logo: dto.logo,
                primaryColor: dto.primaryColor,
                secondaryColor: dto.secondaryColor,
                accentColor: dto.accentColor,
            },
            locale: dto.locale,
            timezone: dto.timezone,
            weekStartsOn: dto.weekStartsOn,
            currency: dto.currency,
            academicYear: dto.academicYearStart && dto.academicYearEnd ? {
                start: dto.academicYearStart,
                end: dto.academicYearEnd,
            } : undefined,
            ...dto.extras,
        });
        return await this.updateTenantSettingsUseCase.execute(command);
    }
}
