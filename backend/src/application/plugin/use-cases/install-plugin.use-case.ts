import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InstalledPlugin } from '../../../domain/plugin/entities/installed-plugin.entity';
import { InstalledPluginRepository } from '../../../domain/plugin/ports/installed-plugin.repository';
import { PluginRepository } from '../../../domain/plugin/ports/plugin.repository';

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
            uuidv4(),
            command.tenantId,
            command.pluginId,
            plugin.version,
            permissions,
        );

        // Save installed plugin
        const saved = await this.installedPluginRepository.save(installedPlugin);

        // Increment download count
        const updatedPlugin = plugin.incrementDownloads();
        await this.pluginRepository.save(updatedPlugin);

        return saved;
    }
}
