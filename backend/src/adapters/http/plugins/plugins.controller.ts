import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Query,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/tenant/tenant.guard';
import { TenantContext } from '../../../common/tenant/tenant.context';
import {
    BrowsePluginsUseCase,
    BrowsePluginsCommand,
    InstallPluginUseCase,
    InstallPluginCommand,
    EnablePluginUseCase,
    EnablePluginCommand,
    DisablePluginUseCase,
    DisablePluginCommand,
    UninstallPluginUseCase,
    UninstallPluginCommand,
    GetInstalledPluginsUseCase,
    GetInstalledPluginsCommand,
} from '../../../application/plugin/use-cases';
import { InstallPluginDto } from './dto/install-plugin.dto';
import { PluginResponseDto } from './dto/plugin-response.dto';
import { InstalledPluginResponseDto } from './dto/installed-plugin-response.dto';
import { Plugin } from '../../../domain/plugin/entities/plugin.entity';
import { InstalledPlugin } from '../../../domain/plugin/entities/installed-plugin.entity';

@ApiTags('Plugins')
@ApiBearerAuth()
@Controller('plugins')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PluginsController {
    constructor(
        private readonly tenantContext: TenantContext,
        private readonly browsePluginsUseCase: BrowsePluginsUseCase,
        private readonly installPluginUseCase: InstallPluginUseCase,
        private readonly enablePluginUseCase: EnablePluginUseCase,
        private readonly disablePluginUseCase: DisablePluginUseCase,
        private readonly uninstallPluginUseCase: UninstallPluginUseCase,
        private readonly getInstalledPluginsUseCase: GetInstalledPluginsUseCase,
    ) { }

    @Get('marketplace')
    @ApiOperation({ summary: 'Browse available plugins in marketplace' })
    async browseMarketplace(
        @Query('category') category?: string,
        @Query('search') search?: string,
    ): Promise<PluginResponseDto[]> {
        const command = new BrowsePluginsCommand(category, search);
        const plugins = await this.browsePluginsUseCase.execute(command);

        const tenantId = this.tenantContext.tenantId;
        const installedPlugins = await this.getInstalledPluginsUseCase.execute(
            new GetInstalledPluginsCommand(tenantId),
        );

        return plugins.map((plugin) => this.toPluginDto(plugin, installedPlugins));
    }

    @Get('installed')
    @ApiOperation({ summary: 'Get all installed plugins for current tenant' })
    async getInstalled(): Promise<InstalledPluginResponseDto[]> {
        const tenantId = this.tenantContext.tenantId;
        const command = new GetInstalledPluginsCommand(tenantId);
        const plugins = await this.getInstalledPluginsUseCase.execute(command);
        return plugins.map((p) => this.toInstalledPluginDto(p));
    }

    @Post('install')
    @ApiOperation({ summary: 'Install a plugin' })
    async install(
        @Body() dto: InstallPluginDto,
    ): Promise<InstalledPluginResponseDto> {
        const tenantId = this.tenantContext.tenantId;
        const command = new InstallPluginCommand(dto.pluginId, tenantId);
        const installed = await this.installPluginUseCase.execute(command);
        return this.toInstalledPluginDto(installed);
    }

    @Post(':pluginId/enable')
    @ApiOperation({ summary: 'Enable an installed plugin' })
    async enable(
        @Param('pluginId') pluginId: string,
    ): Promise<InstalledPluginResponseDto> {
        const tenantId = this.tenantContext.tenantId;
        const command = new EnablePluginCommand(pluginId, tenantId);
        const enabled = await this.enablePluginUseCase.execute(command);
        return this.toInstalledPluginDto(enabled);
    }

    @Post(':pluginId/disable')
    @ApiOperation({ summary: 'Disable an installed plugin' })
    async disable(
        @Param('pluginId') pluginId: string,
    ): Promise<InstalledPluginResponseDto> {
        const tenantId = this.tenantContext.tenantId;
        const command = new DisablePluginCommand(pluginId, tenantId);
        const disabled = await this.disablePluginUseCase.execute(command);
        return this.toInstalledPluginDto(disabled);
    }

    @Delete(':pluginId')
    @ApiOperation({ summary: 'Uninstall a plugin' })
    async uninstall(@Param('pluginId') pluginId: string): Promise<void> {
        const tenantId = this.tenantContext.tenantId;
        const command = new UninstallPluginCommand(pluginId, tenantId);
        await this.uninstallPluginUseCase.execute(command);
    }

    private toPluginDto(
        plugin: Plugin,
        installedPlugins: InstalledPlugin[],
    ): PluginResponseDto {
        const installed = installedPlugins.find((p) => p.pluginId === plugin.pluginId);
        return {
            id: plugin.id,
            pluginId: plugin.pluginId,
            name: plugin.name,
            version: plugin.version,
            description: plugin.description,
            author: plugin.author,
            category: plugin.category,
            status: plugin.status,
            isOfficial: plugin.isOfficial,
            iconUrl: plugin.iconUrl,
            bannerUrl: plugin.bannerUrl,
            screenshots: plugin.screenshots,
            price: plugin.price,
            downloads: plugin.downloads,
            rating: plugin.rating,
            ratingCount: plugin.ratingCount,
            tags: plugin.tags,
            manifest: plugin.manifest,
            changelog: plugin.changelog,
            createdAt: plugin.createdAt,
            updatedAt: plugin.updatedAt,
            isInstalled: !!installed,
            installedVersion: installed?.version,
            installedStatus: installed?.status,
        };
    }

    private toInstalledPluginDto(
        plugin: InstalledPlugin,
    ): InstalledPluginResponseDto {
        return {
            id: plugin.id,
            tenantId: plugin.tenantId,
            pluginId: plugin.pluginId,
            version: plugin.version,
            status: plugin.status,
            settings: plugin.settings,
            permissions: plugin.permissions,
            installedAt: plugin.installedAt,
            enabledAt: plugin.enabledAt,
            disabledAt: plugin.disabledAt,
            lastError: plugin.lastError,
            updatedAt: plugin.updatedAt,
        };
    }
}
