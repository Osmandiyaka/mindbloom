import { Inject, Injectable } from '@nestjs/common';
import { InstalledPluginRepository } from '../../../domain/ports/out/installed-plugin-repository.port';
import { GetInstalledPluginsCommand } from '../../ports/in/commands/plugin/get-installed-plugins.command';

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
