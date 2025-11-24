import { Injectable, Inject } from '@nestjs/common';
import { InstalledPluginRepository } from '../../../domain/plugin/ports/installed-plugin.repository';
import { InstalledPlugin } from '../../../domain/plugin/entities/installed-plugin.entity';

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
    ) { }

    async execute(command: UpdatePluginSettingsCommand): Promise<InstalledPlugin> {
        const installed = await this.installedPluginRepository.findByPluginId(
            command.pluginId,
            command.tenantId,
        );

        if (!installed) {
            throw new Error('Plugin not installed');
        }

        installed.updateSettings(command.settings);
        await this.installedPluginRepository.save(installed);

        return installed;
    }
}
