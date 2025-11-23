import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetTenantBySubdomainUseCase, CreateTenantUseCase } from '../../../application/tenant/use-cases';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Public } from '../../../common/tenant/public.decorator';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantController {
    constructor(
        private readonly getTenantBySubdomainUseCase: GetTenantBySubdomainUseCase,
        private readonly createTenantUseCase: CreateTenantUseCase,
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
}