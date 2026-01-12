import { Controller, Get, Post, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetTenantBySubdomainUseCase, GetTenantByIdUseCase, CreateTenantUseCase, GetTenantSettingsUseCase, UpdateTenantSettingsUseCase, ListTenantsUseCase } from '../../application/services/tenant';
import { EditionManager } from '../../application/services/subscription/edition-manager.service';
import { UpdateTenantSettingsCommand } from '../../application/ports/in/commands/update-tenant-settings.command';
import { TenantResponseDto } from '../dtos/responses/tenant/tenant-response.dto';
import { CreateTenantDto } from '../dtos/requests/tenant/create-tenant.dto';
import { Public } from '../../common/tenant/public.decorator';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { TenantContext } from '../../common/tenant/tenant.context';
import { UpdateTenantSettingsDto } from '../dtos/requests/tenant/update-tenant-settings.dto';
import { ListTenantsQueryDto } from '../dtos/requests/tenant/list-tenants.query.dto';
import { TenantListItemDto, TenantListResponseDto } from '../dtos/responses/tenant/tenant-list.response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantEditionResponseDto } from '../dtos/responses/tenant/tenant-edition.response.dto';
import { Tenant, TenantStatus } from '../../domain/tenant/entities/tenant.entity';
import { PublicTenantLookupQueryDto } from '../dtos/requests/tenant/public-tenant-lookup.query.dto';
import { PublicTenantLookupItemDto } from '../dtos/responses/tenant/public-tenant-lookup.response.dto';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantController {
    constructor(
        private readonly getTenantBySubdomainUseCase: GetTenantBySubdomainUseCase,
        private readonly getTenantByIdUseCase: GetTenantByIdUseCase,
        private readonly createTenantUseCase: CreateTenantUseCase,
        private readonly getTenantSettingsUseCase: GetTenantSettingsUseCase,
        private readonly updateTenantSettingsUseCase: UpdateTenantSettingsUseCase,
        private readonly listTenantsUseCase: ListTenantsUseCase,
        private readonly tenantContext: TenantContext,
        private readonly editionManager: EditionManager,
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
    @Get('lookup')
    @ApiOperation({ summary: 'Search public tenant directory' })
    @ApiResponse({ status: 200, description: 'List of matching tenants', type: [PublicTenantLookupItemDto] })
    async lookupTenants(@Query() query: PublicTenantLookupQueryDto): Promise<PublicTenantLookupItemDto[]> {
        const search = query.search?.trim();
        if (!search || search.length < 2) {
            return [];
        }

        const pageSize = Math.min(query.limit ?? 6, 10);
        const result = await this.listTenantsUseCase.execute({
            search,
            statuses: [TenantStatus.ACTIVE],
            page: 1,
            pageSize,
            sortBy: 'name',
            sortDirection: 'asc',
        });

        const normalized = search.toLowerCase();
        const filtered = result.data.filter((tenant) => {
            const nameMatch = tenant.name?.toLowerCase().includes(normalized);
            const subdomainMatch = tenant.subdomain?.toLowerCase().includes(normalized);
            const domainMatch = tenant.customization?.customDomain?.toLowerCase().includes(normalized);
            return nameMatch || subdomainMatch || domainMatch;
        });

        return filtered.map((tenant) => PublicTenantLookupItemDto.fromDomain(tenant));
    }

    @Public()
    @Post()
    @ApiOperation({ summary: 'Create a new tenant' })
    @ApiResponse({ status: 201, description: 'Tenant created successfully', type: TenantResponseDto })
    async createTenant(@Body() createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
        // Resolve editionId when possible (prefer editionId, fall back to edition code if provided)
        let editionId: string | undefined = createTenantDto.editionId;
        let editionCode: string | undefined = undefined;
        if (!editionId && createTenantDto.edition) {
            try {
                const list = await this.editionManager.listEditions();
                const normalized = String(createTenantDto.edition).toLowerCase();
                const found = list.find(e => e.name?.toLowerCase() === normalized || e.displayName?.toLowerCase() === normalized);
                if (found) {
                    editionId = found.id;
                    editionCode = found.name;
                }
            } catch (err) {
                // non-fatal - continue without editionId
            }
        }

        const tenant = await this.createTenantUseCase.execute({
            name: createTenantDto.name,
            subdomain: createTenantDto.subdomain,
            contactEmail: createTenantDto.contactEmail,
            contactPhone: createTenantDto.contactPhone,
            address: createTenantDto.address,
            branding: createTenantDto.branding,
            limits: createTenantDto.limits,
            editionId: editionId,
            metadata: editionCode ? { ...(createTenantDto['metadata'] || {}), editionCode } : undefined,
            locale: createTenantDto.locale,
            timezone: createTenantDto.timezone,
            weekStartsOn: createTenantDto.weekStartsOn,
            academicYear: createTenantDto.academicYear,
            adminName: createTenantDto.adminName,
            adminEmail: createTenantDto.adminEmail,
            adminPassword: createTenantDto.adminPassword,
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
    @Get('current/edition')
    @ApiOperation({ summary: 'Get current tenant edition and features' })
    @ApiResponse({ status: 200, type: TenantEditionResponseDto })
    async getCurrentEdition(): Promise<TenantEditionResponseDto | null> {
        const tenant = await this.getTenantByIdUseCase.execute(this.tenantContext.tenantId);
        if (!tenant) return null;

        if (tenant.editionId) {
            try {
                const { edition, features } = await this.editionManager.getEditionWithFeatures(tenant.editionId);
                return {
                    editionCode: edition.name,
                    editionName: edition.displayName || edition.name,
                    features: Object.keys(features),
                    modules: edition.modules ?? Object.keys(features),
                };
            } catch (err) {
                return Tenant.editionSnapshot(tenant);
            }
        }

        return Tenant.editionSnapshot(tenant);
    }

    @UseGuards(JwtAuthGuard, PermissionGuard)
    @Permissions('tenants:read')
    @Get()
    @ApiOperation({ summary: 'List all tenants (Host Admin)' })
    @ApiResponse({ status: 200, description: 'List tenants with aggregates', type: TenantListResponseDto })
    async listTenants(@Query() query: ListTenantsQueryDto): Promise<TenantListResponseDto> {
        const trialExpiringBefore = query.trialExpiringInDays
            ? new Date(Date.now() + query.trialExpiringInDays * 24 * 60 * 60 * 1000)
            : undefined;

        const result = await this.listTenantsUseCase.execute({
            search: query.search,
            statuses: query.statuses as any,
            editions: query.editions as any,
            page: query.page,
            pageSize: query.pageSize,
            sortBy: query.sortBy,
            sortDirection: query.sortDirection,
            trialExpiringBefore,
        });

        return {
            data: result.data.map((t) => TenantListItemDto.fromDomain(t)),
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
            aggregates: result.aggregates,
        };
    }

    @UseGuards(JwtAuthGuard, TenantGuard)
    @Put('settings')
    @ApiOperation({ summary: 'Update tenant settings for current tenant' })
    async updateSettings(@Body() dto: UpdateTenantSettingsDto) {
        const command = new UpdateTenantSettingsCommand(this.tenantContext.tenantId, {
            customization: {
                logo: dto.logo,
                favicon: dto.favicon,
                primaryColor: dto.primaryColor,
                secondaryColor: dto.secondaryColor,
                accentColor: dto.accentColor,
                customDomain: dto.customDomain,
            },
            locale: dto.locale,
            timezone: dto.timezone,
            weekStartsOn: dto.weekStartsOn,
            currency: dto.currency,
            academicYear: dto.academicYearStart && dto.academicYearEnd ? {
                start: new Date(dto.academicYearStart),
                end: new Date(dto.academicYearEnd),
            } : undefined,
            idTemplates: dto.idTemplates,
            ...dto.extras,
        });
        return await this.updateTenantSettingsUseCase.execute(command);
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get tenant by ID' })
    @ApiResponse({ status: 200, description: 'Tenant found', type: TenantResponseDto })
    @ApiResponse({ status: 404, description: 'Tenant not found' })
    async getTenantById(@Param('id') id: string): Promise<TenantResponseDto | null> {
        const tenant = await this.getTenantByIdUseCase.execute(id);

        if (!tenant) {
            return null;
        }

        return TenantResponseDto.fromDomain(tenant);
    }
}
