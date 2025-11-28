import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { InstalledPluginRepository } from '../../../domain/ports/out/installed-plugin-repository.port';
import { InstalledPlugin } from '../../../domain/plugin/entities/installed-plugin.entity';
import { PluginRegistry } from '../../../core/plugins/plugin.registry';
import { UpdatePluginSettingsCommand } from '../../ports/in/commands/plugin/update-plugin-settings.command';

@Injectable()
export class UpdatePluginSettingsUseCase {
    constructor(
        @Inject('InstalledPluginRepository')
        private readonly installedPluginRepository: InstalledPluginRepository,
        private readonly pluginRegistry: PluginRegistry,
    ) { }

    async execute(command: UpdatePluginSettingsCommand): Promise<InstalledPlugin> {
        const installed = await this.installedPluginRepository.findByPluginId(
            command.pluginId,
            command.tenantId,
        );

        if (!installed) {
            throw new Error('Plugin not installed');
        }

        const plugin = this.pluginRegistry.getPlugin(command.pluginId);
        const manifestSettings = plugin?.manifest?.provides?.settings || [];

        for (const field of manifestSettings) {
            if (field.required && (command.settings?.[field.key] === undefined || command.settings?.[field.key] === null || command.settings?.[field.key] === '')) {
                throw new BadRequestException(`Missing required setting: ${field.label || field.key}`);
            }
        }

        installed.updateSettings(command.settings);
        await this.installedPluginRepository.save(installed);

        return installed;
    }
}
