import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InstalledPluginRepository } from '../../../domain/ports/out/installed-plugin-repository.port';
import { PluginRegistry } from '../../../core/plugins/plugin.registry';
import { PluginContextFactory } from '../../../core/plugins/plugin-context.factory';
import { EventBus, PlatformEvent } from '../../../core/plugins/event-bus.service';
import { EnablePluginCommand } from '../../ports/in/commands/plugin/enable-plugin.command';

@Injectable()
export class EnablePluginUseCase {
    constructor(
        @Inject('InstalledPluginRepository')
        private readonly installedPluginRepository: InstalledPluginRepository,
        private readonly pluginRegistry: PluginRegistry,
        private readonly pluginContextFactory: PluginContextFactory,
        private readonly eventBus: EventBus,
    ) { }

    async execute(command: EnablePluginCommand) {
        const installedPlugin = await this.installedPluginRepository.findByPluginId(
            command.pluginId,
            command.tenantId,
        );

        if (!installedPlugin) {
            throw new NotFoundException('Plugin not installed');
        }

        const enabled = installedPlugin.enable();
        const saved = await this.installedPluginRepository.save(enabled);

        const context = this.pluginContextFactory.create(command.tenantId, command.pluginId);
        await this.pluginRegistry.enablePlugin(command.pluginId, context);
        this.eventBus.publish(PlatformEvent.PLUGIN_ENABLED, { pluginId: command.pluginId, tenantId: command.tenantId }, command.tenantId);

        return saved;
    }
}
