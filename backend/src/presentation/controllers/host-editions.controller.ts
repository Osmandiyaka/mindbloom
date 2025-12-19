import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { HostContextGuard } from '../../common/guards/host-context.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { EditionManager } from '../../application/services/subscription/edition-manager.service';
import { CreateEditionDto } from '../dtos/requests/editions/create-edition.dto';
import { UpdateEditionDto } from '../dtos/requests/editions/update-edition.dto';
import { SetEditionFeaturesDto } from '../dtos/requests/editions/set-edition-features.dto';

@ApiTags('Host Editions')
@Controller('host/editions')
@UseGuards(JwtAuthGuard, HostContextGuard, PermissionGuard)
export class HostEditionsController {
    constructor(private readonly editionManager: EditionManager) { }

    @Get()
    @Permissions('Host.Editions.View')
    @ApiOperation({ summary: 'List editions (host-only)' })
    async list() {
        return this.editionManager.listEditions();
    }

    @Get(':id')
    @Permissions('Host.Editions.View')
    @ApiOperation({ summary: 'Get edition with features (host-only)' })
    async get(@Param('id') id: string) {
        return this.editionManager.getEditionWithFeatures(id);
    }

    @Post()
    @Permissions('Host.Editions.Manage')
    @ApiOperation({ summary: 'Create edition (host-only)' })
    async create(@Body() dto: CreateEditionDto) {
        return this.editionManager.createEdition(dto);
    }

    @Put(':id')
    @Permissions('Host.Editions.Manage')
    @ApiOperation({ summary: 'Update edition (host-only)' })
    async update(@Param('id') id: string, @Body() dto: UpdateEditionDto) {
        return this.editionManager.updateEdition(id, dto);
    }

    @Put(':id/features')
    @Permissions('Host.Editions.Manage')
    @ApiOperation({ summary: 'Replace edition feature assignments (host-only)' })
    async setFeatures(@Param('id') id: string, @Body() dto: SetEditionFeaturesDto) {
        await this.editionManager.setEditionFeatures(id, dto.features);
        return { success: true };
    }
}
