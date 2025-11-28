import { Inject, Injectable } from '@nestjs/common';
import { InstalledPluginRepository } from '../../../domain/ports/out/installed-plugin-repository.port';

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
