import { Injectable, Logger, Inject } from '@nestjs/common';
import { IPlugin } from '../../core/plugins/plugin.interface';
import { PluginContext } from '../../core/plugins/plugin.context';
import { EventBus } from '../../core/plugins/event-bus.service';
import { InstalledPluginRepository } from '../../domain/plugin/ports/installed-plugin.repository';

/**
 * Plugin Registry - Manages the lifecycle of installed plugins
 */
@Injectable()
export class PluginRegistry {
    private readonly logger = new Logger(PluginRegistry.name);
    private loadedPlugins: Map<string, IPlugin> = new Map();
    private pluginContexts: Map<string, PluginContext> = new Map();

    constructor(
        @Inject('InstalledPluginRepository')
        private readonly installedPluginRepository: InstalledPluginRepository,
        private readonly eventBus: EventBus,
    ) { }

    /**
     * Register a plugin class
     */
    registerPlugin(pluginId: string, plugin: IPlugin): void {
        this.loadedPlugins.set(pluginId, plugin);
        this.logger.log(`Plugin registered: ${pluginId}`);
    }

    /**
     * Load all enabled plugins for a tenant
     */
    async loadEnabledPlugins(tenantId: string): Promise<void> {
        const enabledPlugins = await this.installedPluginRepository.findEnabledPlugins(tenantId);

        this.logger.log(`Loading ${enabledPlugins.length} enabled plugins for tenant ${tenantId}`);

        for (const installedPlugin of enabledPlugins) {
            const plugin = this.loadedPlugins.get(installedPlugin.pluginId);

            if (!plugin) {
                this.logger.warn(`Plugin not found: ${installedPlugin.pluginId}`);
                continue;
            }

            try {
                const context = this.createPluginContext(tenantId, installedPlugin.pluginId, installedPlugin.settings);
                await plugin.onEnable(context);
                this.pluginContexts.set(`${tenantId}:${installedPlugin.pluginId}`, context);
                this.logger.log(`Plugin enabled: ${installedPlugin.pluginId} for tenant ${tenantId}`);
            } catch (error) {
                this.logger.error(`Failed to enable plugin ${installedPlugin.pluginId}:`, error);

                // Mark plugin as error
                const updatedPlugin = installedPlugin.setError(error.message);
                await this.installedPluginRepository.save(updatedPlugin);
            }
        }
    }

    /**
     * Install a plugin for a tenant
     */
    async installPlugin(tenantId: string, pluginId: string): Promise<void> {
        const plugin = this.loadedPlugins.get(pluginId);

        if (!plugin) {
            throw new Error(`Plugin not found: ${pluginId}`);
        }

        const context = this.createPluginContext(tenantId, pluginId, {});

        try {
            await plugin.onInstall(context);
            this.logger.log(`Plugin installed: ${pluginId} for tenant ${tenantId}`);
        } catch (error) {
            this.logger.error(`Failed to install plugin ${pluginId}:`, error);
            throw error;
        }
    }

    /**
     * Enable a plugin for a tenant
     */
    async enablePlugin(tenantId: string, pluginId: string): Promise<void> {
        const plugin = this.loadedPlugins.get(pluginId);

        if (!plugin) {
            throw new Error(`Plugin not found: ${pluginId}`);
        }

        const installedPlugin = await this.installedPluginRepository.findByPluginId(pluginId, tenantId);
        if (!installedPlugin) {
            throw new Error('Plugin not installed');
        }

        const context = this.createPluginContext(tenantId, pluginId, installedPlugin.settings);

        try {
            await plugin.onEnable(context);
            this.pluginContexts.set(`${tenantId}:${pluginId}`, context);
            this.logger.log(`Plugin enabled: ${pluginId} for tenant ${tenantId}`);
        } catch (error) {
            this.logger.error(`Failed to enable plugin ${pluginId}:`, error);
            throw error;
        }
    }

    /**
     * Disable a plugin for a tenant
     */
    async disablePlugin(tenantId: string, pluginId: string): Promise<void> {
        const plugin = this.loadedPlugins.get(pluginId);

        if (!plugin) {
            throw new Error(`Plugin not found: ${pluginId}`);
        }

        const contextKey = `${tenantId}:${pluginId}`;
        const context = this.pluginContexts.get(contextKey);

        if (!context) {
            this.logger.warn(`Context not found for plugin ${pluginId}`);
            return;
        }

        try {
            await plugin.onDisable(context);
            this.pluginContexts.delete(contextKey);
            this.logger.log(`Plugin disabled: ${pluginId} for tenant ${tenantId}`);
        } catch (error) {
            this.logger.error(`Failed to disable plugin ${pluginId}:`, error);
            throw error;
        }
    }

    /**
     * Uninstall a plugin for a tenant
     */
    async uninstallPlugin(tenantId: string, pluginId: string): Promise<void> {
        const plugin = this.loadedPlugins.get(pluginId);

        if (!plugin) {
            throw new Error(`Plugin not found: ${pluginId}`);
        }

        // Disable first if enabled
        const contextKey = `${tenantId}:${pluginId}`;
        if (this.pluginContexts.has(contextKey)) {
            await this.disablePlugin(tenantId, pluginId);
        }

        const installedPlugin = await this.installedPluginRepository.findByPluginId(pluginId, tenantId);
        if (!installedPlugin) {
            throw new Error('Plugin not installed');
        }

        const context = this.createPluginContext(tenantId, pluginId, installedPlugin.settings);

        try {
            await plugin.onUninstall(context);
            this.logger.log(`Plugin uninstalled: ${pluginId} for tenant ${tenantId}`);
        } catch (error) {
            this.logger.error(`Failed to uninstall plugin ${pluginId}:`, error);
            throw error;
        }
    }

    /**
     * Get plugin context for a tenant
     */
    getPluginContext(tenantId: string, pluginId: string): PluginContext | undefined {
        return this.pluginContexts.get(`${tenantId}:${pluginId}`);
    }

    /**
     * Check if a plugin is loaded
     */
    isPluginLoaded(pluginId: string): boolean {
        return this.loadedPlugins.has(pluginId);
    }

    /**
     * Get all loaded plugin IDs
     */
    getLoadedPluginIds(): string[] {
        return Array.from(this.loadedPlugins.keys());
    }

    /**
     * Create a plugin context
     */
    private createPluginContext(
        tenantId: string,
        pluginId: string,
        settings: Record<string, any>,
    ): PluginContext {
        return {
            tenantId,
            pluginId,
            logger: new Logger(`Plugin:${pluginId}`),
            eventBus: this.eventBus,
            settings: {
                get: async (key: string) => settings[key],
                set: async (key: string, value: any) => {
                    settings[key] = value;
                    // In production: persist to database
                },
                clear: async () => {
                    Object.keys(settings).forEach(key => delete settings[key]);
                    // In production: persist to database
                },
            },
            hasPermission: (permission: string) => {
                // In production: check against tenant's plugin permissions
                return true;
            },
        };
    }
}
