import { Plugin } from '../entities/plugin.entity';

export interface PluginRepository {
    findAll(): Promise<Plugin[]>;
    findById(id: string): Promise<Plugin | null>;
    findByPluginId(pluginId: string): Promise<Plugin | null>;
    findByCategory(category: string): Promise<Plugin[]>;
    search(query: string): Promise<Plugin[]>;
    save(plugin: Plugin): Promise<Plugin>;
    delete(id: string): Promise<void>;
}
