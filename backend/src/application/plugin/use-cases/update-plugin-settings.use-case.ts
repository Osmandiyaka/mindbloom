import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { InstalledPluginRepository } from '../../../domain/plugin/ports/installed-plugin.repository';
import { InstalledPlugin } from '../../../domain/plugin/entities/installed-plugin.entity';
import { PluginRegistry } from '../../../core/plugins/plugin.registry';

export class UpdatePluginSettingsCommand {
    constructor(
        public readonly pluginId: string,
        public readonly tenantId: string,
        public readonly settings: Record<string, any>,
    ) { }
}

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
