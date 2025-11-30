import { Plugin } from '../../plugin/entities/plugin.entity';
import { PLUGIN_REPOSITORY } from './repository.tokens';

export interface PluginRepository {
    findAll(): Promise<Plugin[]>;
    findById(id: string): Promise<Plugin | null>;
    findByPluginId(pluginId: string): Promise<Plugin | null>;
    findByCategory(category: string): Promise<Plugin[]>;
    search(query: string): Promise<Plugin[]>;
    save(plugin: Plugin): Promise<Plugin>;
    delete(id: string): Promise<void>;
}

export { PLUGIN_REPOSITORY } from './repository.tokens';
