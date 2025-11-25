import { Injectable, Logger } from '@nestjs/common';
import { PluginContext } from './plugin.context';
import { EventBus } from './event-bus.service';

/**
 * Factory to build PluginContext with tenant + plugin scope.
 * Centralizes construction to keep use cases simple.
 */
@Injectable()
export class PluginContextFactory {
    constructor(
        private readonly eventBus: EventBus,
    ) { }

    create(tenantId: string, pluginId: string): PluginContext {
        const logger = new Logger(`Plugin:${pluginId}:${tenantId}`);
        return new PluginContext(tenantId, pluginId, this.eventBus, logger);
    }
}
