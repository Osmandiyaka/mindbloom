import { Inject, Injectable } from '@nestjs/common';
import { InstalledPluginRepository } from '../../../domain/plugin/ports/installed-plugin.repository';

export class GetInstalledPluginsCommand {
    constructor(public readonly tenantId: string) { }
}

@Injectable()
export class GetInstalledPluginsUseCase {
    constructor(
        @Inject('InstalledPluginRepository')
        private readonly installedPluginRepository: InstalledPluginRepository,
    ) { }

    async execute(command: GetInstalledPluginsCommand) {
        return await this.installedPluginRepository.findAll(command.tenantId);
    }
}
