import { InstalledPlugin } from '../../plugin/entities/installed-plugin.entity';
import { INSTALLED_PLUGIN_REPOSITORY } from './repository.tokens';

export interface InstalledPluginRepository {
    findAll(tenantId: string): Promise<InstalledPlugin[]>;
    findById(id: string, tenantId: string): Promise<InstalledPlugin | null>;
    findByPluginId(
        pluginId: string,
        tenantId: string,
    ): Promise<InstalledPlugin | null>;
    findEnabledPlugins(tenantId: string): Promise<InstalledPlugin[]>;
    save(plugin: InstalledPlugin): Promise<InstalledPlugin>;
    delete(id: string, tenantId: string): Promise<void>;
}

export { INSTALLED_PLUGIN_REPOSITORY } from './repository.tokens';
