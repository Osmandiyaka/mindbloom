import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PluginSchema } from '../../infrastructure/persistence/mongoose/schemas/plugin.schema';
import { InstalledPluginSchema } from '../../infrastructure/persistence/mongoose/schemas/installed-plugin.schema';
import { MongoosePluginRepository } from '../../infrastructure/persistence/mongoose/repositories/mongoose-plugin.repository';
import { MongooseInstalledPluginRepository } from '../../infrastructure/persistence/mongoose/repositories/mongoose-installed-plugin.repository';
import {
    BrowsePluginsUseCase,
    InstallPluginUseCase,
    EnablePluginUseCase,
    DisablePluginUseCase,
    UninstallPluginUseCase,
    GetInstalledPluginsUseCase,
} from '../../application/plugin/use-cases';
import { PluginsController } from '../../adapters/http/plugins/plugins.controller';
import { PluginRegistry } from '../../core/plugins/plugin.registry';
import { EventBus } from '../../core/plugins/event-bus.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Plugin', schema: PluginSchema },
            { name: 'InstalledPlugin', schema: InstalledPluginSchema },
        ]),
    ],
    controllers: [PluginsController],
    providers: [
        {
            provide: 'PluginRepository',
            useClass: MongoosePluginRepository,
        },
        {
            provide: 'InstalledPluginRepository',
            useClass: MongooseInstalledPluginRepository,
        },
        EventBus,
        PluginRegistry,
        BrowsePluginsUseCase,
        InstallPluginUseCase,
        EnablePluginUseCase,
        DisablePluginUseCase,
        UninstallPluginUseCase,
        GetInstalledPluginsUseCase,
    ],
    exports: [
        'PluginRepository',
        'InstalledPluginRepository',
        PluginRegistry,
        GetInstalledPluginsUseCase,
    ],
})
export class PluginsModule { }
