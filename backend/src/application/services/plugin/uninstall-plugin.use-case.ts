import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InstalledPluginRepository } from '../../../domain/ports/out/installed-plugin-repository.port';
import { PluginRegistry } from '../../../core/plugins/plugin.registry';
import { PluginContextFactory } from '../../../core/plugins/plugin-context.factory';
import { EventBus, PlatformEvent } from '../../../core/plugins/event-bus.service';
import { UninstallPluginCommand } from '../../ports/in/commands/plugin/uninstall-plugin.command';

@Injectable()
export class UninstallPluginUseCase {
    constructor(
        @Inject('InstalledPluginRepository')
        private readonly installedPluginRepository: InstalledPluginRepository,
        private readonly pluginRegistry: PluginRegistry,
        private readonly pluginContextFactory: PluginContextFactory,
        private readonly eventBus: EventBus,
    ) { }

    async execute(command: UninstallPluginCommand) {
        const installedPlugin = await this.installedPluginRepository.findByPluginId(
            command.pluginId,
            command.tenantId,
        );

        if (!installedPlugin) {
            throw new NotFoundException('Plugin not installed');
        }

        const context = this.pluginContextFactory.create(command.tenantId, command.pluginId);
        await this.pluginRegistry.uninstallPlugin(command.pluginId, context);
        this.eventBus.publish(PlatformEvent.PLUGIN_DISABLED, { pluginId: command.pluginId, tenantId: command.tenantId }, command.tenantId);

        await this.installedPluginRepository.delete(
            installedPlugin.id,
            command.tenantId,
        );
    }
}
