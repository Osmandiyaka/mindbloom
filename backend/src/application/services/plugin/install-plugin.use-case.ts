import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InstalledPlugin } from '../../../domain/plugin/entities/installed-plugin.entity';
import { InstalledPluginRepository } from '../../../domain/ports/out/installed-plugin-repository.port';
import { PluginRepository } from '../../../domain/ports/out/plugin-repository.port';
import { PluginRegistry } from '../../../core/plugins/plugin.registry';
import { PluginContextFactory } from '../../../core/plugins/plugin-context.factory';
import { EventBus, PlatformEvent } from '../../../core/plugins/event-bus.service';

export class InstallPluginCommand {
    constructor(
        public readonly pluginId: string,
        public readonly tenantId: string,
    ) { }
}

@Injectable()
export class InstallPluginUseCase {
    constructor(
        @Inject('PluginRepository')
        private readonly pluginRepository: PluginRepository,
        @Inject('InstalledPluginRepository')
        private readonly installedPluginRepository: InstalledPluginRepository,
        private readonly pluginRegistry: PluginRegistry,
        private readonly pluginContextFactory: PluginContextFactory,
        private readonly eventBus: EventBus,
    ) { }

    async execute(command: InstallPluginCommand): Promise<InstalledPlugin> {
        // Check if plugin exists in marketplace
        const plugin = await this.pluginRepository.findByPluginId(command.pluginId);
        if (!plugin) {
            throw new NotFoundException('Plugin not found in marketplace');
        }

        // Check if already installed
        const existing = await this.installedPluginRepository.findByPluginId(
            command.pluginId,
            command.tenantId,
        );
        if (existing) {
            throw new Error('Plugin already installed');
        }

        // Extract permissions from manifest
        const permissions = plugin.manifest?.permissions || [];

        // Create installed plugin
        const installedPlugin = InstalledPlugin.create(
            '', // MongoDB will generate ObjectId
            command.tenantId,
            command.pluginId,
            plugin.version,
            permissions,
        );

        // Save installed plugin
        const saved = await this.installedPluginRepository.save(installedPlugin);

        // Execute plugin install hook
        const context = this.pluginContextFactory.create(command.tenantId, command.pluginId);
        await this.pluginRegistry.installPlugin(command.pluginId, context);

        // Emit platform event
        this.eventBus.publish(PlatformEvent.PLUGIN_INSTALLED, { pluginId: command.pluginId, tenantId: command.tenantId }, command.tenantId);

        // Increment download count
        const updatedPlugin = plugin.incrementDownloads();
        await this.pluginRepository.save(updatedPlugin);

        return saved;
    }
}
