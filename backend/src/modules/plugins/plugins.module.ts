import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
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
    UpdatePluginSettingsUseCase,
} from '../../application/plugin/use-cases';
import { PluginsController } from '../../adapters/http/plugins/plugins.controller';
import { PluginRegistry } from '../../core/plugins/plugin.registry';
import { EventBus } from '../../core/plugins/event-bus.service';
import { SmsNotificationPluginModule } from '../../plugins/sms-notification/sms-notification.module';
import { SmsNotificationPlugin } from '../../plugins/sms-notification/sms-notification.plugin';
import { LibraryManagementModule } from '../../plugins/library-management/library.module';
import { LibraryManagementPlugin } from '../../plugins/library-management/library.plugin';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Plugin', schema: PluginSchema },
            { name: 'InstalledPlugin', schema: InstalledPluginSchema },
        ]),
        EventEmitterModule.forRoot(),
        SmsNotificationPluginModule,
        LibraryManagementModule,
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
        BrowsePluginsUseCase,
        InstallPluginUseCase,
        EnablePluginUseCase,
        DisablePluginUseCase,
        UninstallPluginUseCase,
        GetInstalledPluginsUseCase,
        UpdatePluginSettingsUseCase,
        EventBus,
        PluginRegistry,
        SmsNotificationPlugin,
        LibraryManagementPlugin,
    ],
    exports: [
        'PluginRepository',
        'InstalledPluginRepository',
        GetInstalledPluginsUseCase,
        PluginRegistry,
        EventBus,
    ],
})
export class PluginsModule { }
