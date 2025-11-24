import { Injectable, Logger } from '@nestjs/common';
import { IPlugin } from './plugin.interface';
import { PluginContext } from './plugin.context';
import { SmsNotificationPlugin } from '../../plugins/sms-notification/sms-notification.plugin';

/**
 * Plugin Registry - Manages all available plugins
 */
@Injectable()
export class PluginRegistry {
    private readonly logger = new Logger(PluginRegistry.name);
    private plugins: Map<string, IPlugin> = new Map();

    constructor(
        private readonly smsPlugin: SmsNotificationPlugin,
        // Add more plugins here as they are created
    ) {
        this.registerPlugins();
    }

    /**
     * Register all available plugins
     */
    private registerPlugins(): void {
        this.register(this.smsPlugin);
        // Register more plugins as they are created

        this.logger.log(`Registered ${this.plugins.size} plugins`);
    }

    /**
     * Register a single plugin
     */
    private register(plugin: IPlugin): void {
        const pluginId = plugin.manifest.id;
        if (this.plugins.has(pluginId)) {
            this.logger.warn(`Plugin ${pluginId} is already registered`);
            return;
        }

        this.plugins.set(pluginId, plugin);
        this.logger.log(`Registered plugin: ${plugin.manifest.name} (${pluginId})`);
    }

    /**
     * Get a plugin by ID
     */
    getPlugin(pluginId: string): IPlugin | undefined {
        return this.plugins.get(pluginId);
    }

    /**
     * Get all registered plugins
     */
    getAllPlugins(): IPlugin[] {
        return Array.from(this.plugins.values());
    }

    /**
     * Check if a plugin is registered
     */
    hasPlugin(pluginId: string): boolean {
        return this.plugins.has(pluginId);
    }

    /**
     * Execute plugin lifecycle hook: onInstall
     */
    async installPlugin(pluginId: string, context: PluginContext): Promise<void> {
        const plugin = this.getPlugin(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found in registry`);
        }

        this.logger.log(`Installing plugin ${pluginId} for tenant ${context.tenantId}`);
        await plugin.onInstall(context);
        this.logger.log(`Plugin ${pluginId} installed successfully`);
    }

    /**
     * Execute plugin lifecycle hook: onEnable
     */
    async enablePlugin(pluginId: string, context: PluginContext): Promise<void> {
        const plugin = this.getPlugin(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found in registry`);
        }

        this.logger.log(`Enabling plugin ${pluginId} for tenant ${context.tenantId}`);
        await plugin.onEnable(context);
        this.logger.log(`Plugin ${pluginId} enabled successfully`);
    }

    /**
     * Execute plugin lifecycle hook: onDisable
     */
    async disablePlugin(pluginId: string, context: PluginContext): Promise<void> {
        const plugin = this.getPlugin(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found in registry`);
        }

        this.logger.log(`Disabling plugin ${pluginId} for tenant ${context.tenantId}`);
        await plugin.onDisable(context);
        this.logger.log(`Plugin ${pluginId} disabled successfully`);
    }

    /**
     * Execute plugin lifecycle hook: onUninstall
     */
    async uninstallPlugin(pluginId: string, context: PluginContext): Promise<void> {
        const plugin = this.getPlugin(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found in registry`);
        }

        this.logger.log(`Uninstalling plugin ${pluginId} for tenant ${context.tenantId}`);
        await plugin.onUninstall(context);
        this.logger.log(`Plugin ${pluginId} uninstalled successfully`);
    }
}
