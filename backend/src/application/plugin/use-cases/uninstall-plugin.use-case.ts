import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InstalledPluginRepository } from '../../../domain/plugin/ports/installed-plugin.repository';

export class UninstallPluginCommand {
    constructor(
        public readonly pluginId: string,
        public readonly tenantId: string,
    ) { }
}

@Injectable()
export class UninstallPluginUseCase {
    constructor(
        @Inject('InstalledPluginRepository')
        private readonly installedPluginRepository: InstalledPluginRepository,
    ) { }

    async execute(command: UninstallPluginCommand) {
        const installedPlugin = await this.installedPluginRepository.findByPluginId(
            command.pluginId,
            command.tenantId,
        );

        if (!installedPlugin) {
            throw new NotFoundException('Plugin not installed');
        }

        await this.installedPluginRepository.delete(
            installedPlugin.id,
            command.tenantId,
        );
    }
}
