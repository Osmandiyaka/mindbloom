import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InstalledPluginRepository } from '../../../domain/plugin/ports/installed-plugin.repository';

export class DisablePluginCommand {
    constructor(
        public readonly pluginId: string,
        public readonly tenantId: string,
    ) { }
}

@Injectable()
export class DisablePluginUseCase {
    constructor(
        @Inject('InstalledPluginRepository')
        private readonly installedPluginRepository: InstalledPluginRepository,
    ) { }

    async execute(command: DisablePluginCommand) {
        const installedPlugin = await this.installedPluginRepository.findByPluginId(
            command.pluginId,
            command.tenantId,
        );

        if (!installedPlugin) {
            throw new NotFoundException('Plugin not installed');
        }

        const disabled = installedPlugin.disable();
        return await this.installedPluginRepository.save(disabled);
    }
}
