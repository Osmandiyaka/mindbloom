import { Inject, Injectable } from '@nestjs/common';
import { PluginRepository } from '../../../domain/ports/out/plugin-repository.port';
import { BrowsePluginsQuery } from '../../ports/in/queries/browse-plugins.query';

@Injectable()
export class BrowsePluginsUseCase {
    constructor(
        @Inject('PluginRepository')
        private readonly pluginRepository: PluginRepository,
    ) { }

    async execute(query: BrowsePluginsQuery) {
        if (query.search) {
            return await this.pluginRepository.search(query.search);
        }

        if (query.category) {
            return await this.pluginRepository.findByCategory(query.category);
        }

        return await this.pluginRepository.findAll();
    }
}
