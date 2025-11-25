import { Logger } from '@nestjs/common';
import { EventBus } from './event-bus.service';
import { InstalledPluginRepository } from '../../domain/plugin/ports/installed-plugin.repository';

/**
 * Plugin Context - Provides isolated, tenant-aware access to platform services
 * 
 * This context is passed to all plugin lifecycle hooks and provides:
 * - Tenant isolation
 * - Database access
 * - Event bus for inter-plugin communication
 * - Logging
 * - Storage access
 */
export class PluginContext {
    constructor(
        private readonly _tenantId: string,
        private readonly _pluginId: string,
        private readonly _eventBus: EventBus,
        private readonly _logger: Logger,
        private readonly installedRepo?: InstalledPluginRepository,
    ) { }

    /**
     * Get the current tenant ID
     */
    get tenantId(): string {
        return this._tenantId;
    }

    /**
     * Get the current plugin ID
     */
    get pluginId(): string {
        return this._pluginId;
    }

    /**
     * Get database adapter for tenant-isolated queries
     * All database operations are automatically scoped to the current tenant
     */
    getDatabaseAdapter(): DatabaseAdapter {
        return new DatabaseAdapter(this._tenantId, this._pluginId);
    }

    /**
     * Get storage adapter for plugin-specific file storage
     * Storage path: {env}-plugins-{pluginId}-{tenantId}/
     */
    getStorageAdapter(): StorageAdapter {
        return new StorageAdapter(`plugins/${this._pluginId}/${this._tenantId}`);
    }

    /**
     * Get event bus for publishing and subscribing to events
     * All events are tenant-isolated
     */
    getEventBus(): EventBus {
        return this._eventBus;
    }

    /**
     * Get plugin-scoped logger
     * All logs include plugin and tenant context
     */
    getLogger(): Logger {
        return this._logger;
    }

    /**
     * Get plugin configuration/settings
     */
    async getConfig<T = any>(): Promise<T> {
        if (!this.installedRepo) return {} as T;
        const installedPlugin = await this.installedRepo.findByPluginId(this._pluginId, this._tenantId);
        return installedPlugin ? (installedPlugin.settings as T) : ({} as T);
    }

    /**
     * Update plugin configuration/settings
     */
    async setConfig<T = any>(config: T): Promise<void> {
        if (!this.installedRepo) return;
        const installedPlugin = await this.installedRepo.findByPluginId(this._pluginId, this._tenantId);
        if (!installedPlugin) return;

        const updated = installedPlugin.updateSettings(config as Record<string, any>);
        await this.installedRepo.save(updated);
    }
}

/**
 * Database Adapter - Provides tenant-isolated database access
 */
export class DatabaseAdapter {
    constructor(
        private readonly tenantId: string,
        private readonly pluginId: string,
    ) { }

    /**
     * Get collection name with tenant and plugin prefix
     * Example: greenfield_sms_gateway_messages
     */
    private getCollectionName(name: string): string {
        return `${this.tenantId}_${this.pluginId}_${name}`;
    }

    /**
     * Create a new collection for plugin data
     */
    async createCollection(name: string): Promise<void> {
        const collectionName = this.getCollectionName(name);
        const mongoose = await import('mongoose');
        const connection = mongoose.connection;
        const exists = await connection.db.listCollections({ name: collectionName }).hasNext();
        if (!exists) {
            await connection.createCollection(collectionName);
        }
    }

    /**
     * Drop a collection
     */
    async dropCollection(name: string): Promise<void> {
        const collectionName = this.getCollectionName(name);
        const mongoose = await import('mongoose');
        const connection = mongoose.connection;
        const exists = await connection.db.listCollections({ name: collectionName }).hasNext();
        if (exists) {
            await connection.db.dropCollection(collectionName);
        }
    }

    /**
     * Insert document into collection
     */
    async insert(collectionName: string, document: any): Promise<any> {
        const mongoose = await import('mongoose');
        const connection = mongoose.connection;
        const collection = connection.collection(this.getCollectionName(collectionName));
        const result = await collection.insertOne({ ...document, tenantId: this.tenantId, pluginId: this.pluginId });
        return { ...document, _id: result.insertedId };
    }

    /**
     * Find documents in collection
     */
    async find(collectionName: string, query: any): Promise<any[]> {
        const mongoose = await import('mongoose');
        const connection = mongoose.connection;
        const collection = connection.collection(this.getCollectionName(collectionName));
        return collection.find({ tenantId: this.tenantId, pluginId: this.pluginId, ...query }).toArray();
    }

    /**
     * Update document in collection
     */
    async update(collectionName: string, query: any, update: any): Promise<void> {
        const mongoose = await import('mongoose');
        const connection = mongoose.connection;
        const collection = connection.collection(this.getCollectionName(collectionName));
        await collection.updateMany({ tenantId: this.tenantId, pluginId: this.pluginId, ...query }, update);
    }

    /**
     * Delete documents from collection
     */
    async delete(collectionName: string, query: any): Promise<void> {
        const mongoose = await import('mongoose');
        const connection = mongoose.connection;
        const collection = connection.collection(this.getCollectionName(collectionName));
        await collection.deleteMany({ tenantId: this.tenantId, pluginId: this.pluginId, ...query });
    }
}

/**
 * Storage Adapter - Provides file storage access for plugins
 */
export class StorageAdapter {
    constructor(private readonly basePath: string) { }

    /**
     * Upload a file
     */
    async upload(fileName: string, data: Buffer): Promise<string> {
        const filePath = `${this.basePath}/${fileName}`;
        // TODO: Implement S3/file upload
        console.log(`Uploading file: ${filePath}`);
        return filePath;
    }

    /**
     * Download a file
     */
    async download(fileName: string): Promise<Buffer> {
        const filePath = `${this.basePath}/${fileName}`;
        // TODO: Implement S3/file download
        console.log(`Downloading file: ${filePath}`);
        return Buffer.from('');
    }

    /**
     * Delete a file
     */
    async delete(fileName: string): Promise<void> {
        const filePath = `${this.basePath}/${fileName}`;
        // TODO: Implement S3/file delete
        console.log(`Deleting file: ${filePath}`);
    }

    /**
     * List files in plugin storage
     */
    async list(): Promise<string[]> {
        // TODO: Implement S3/file list
        return [];
    }
}
