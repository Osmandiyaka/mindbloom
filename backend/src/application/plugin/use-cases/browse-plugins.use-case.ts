import { Inject, Injectable } from '@nestjs/common';
import { PluginRepository } from '../../../domain/plugin/ports/plugin.repository';

export class BrowsePluginsCommand {
    constructor(
        public readonly category?: string,
        public readonly search?: string,
    ) { }
}

@Injectable()
export class BrowsePluginsUseCase {
    constructor(
        @Inject('PluginRepository')
        private readonly pluginRepository: PluginRepository,
    ) { }

    async execute(command: BrowsePluginsCommand) {
        if (command.search) {
            return await this.pluginRepository.search(command.search);
        }

        if (command.category) {
            return await this.pluginRepository.findByCategory(command.category);
        }

        return await this.pluginRepository.findAll();
    }
}
