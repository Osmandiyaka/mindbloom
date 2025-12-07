import { Injectable, Logger } from '@nestjs/common';
import { PluginContext } from './plugin.context';
import { EventBus } from './event-bus.service';
import { StorageManager } from '../storage/storage.manager';

/**
 * Factory to build PluginContext with tenant + plugin scope.
 * Centralizes construction to keep use cases simple.
 */
@Injectable()
export class PluginContextFactory {
    constructor(
        private readonly eventBus: EventBus,
        private readonly storageManager: StorageManager,
    ) { }

    create(tenantId: string, pluginId: string): PluginContext {
        const logger = new Logger(`Plugin:${pluginId}:${tenantId}`);
        return new PluginContext(tenantId, pluginId, this.eventBus, logger, this.storageManager);
    }
}
