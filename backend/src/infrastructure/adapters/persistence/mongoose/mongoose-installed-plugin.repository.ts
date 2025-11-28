import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    InstalledPlugin,
    InstalledPluginStatus,
} from '@domain/plugin/entities/installed-plugin.entity';
import { InstalledPluginRepository } from '@domain/ports/out/installed-plugin-repository.port'; @Injectable()
export class MongooseInstalledPluginRepository
    implements InstalledPluginRepository {
    constructor(
        @InjectModel('InstalledPlugin')
        private readonly installedPluginModel: Model<any>,
    ) { }

    async findAll(tenantId: string): Promise<InstalledPlugin[]> {
        const docs = await this.installedPluginModel.find({ tenantId }).exec();
        return docs.map((doc) => this.toDomain(doc));
    }

    async findById(id: string, tenantId: string): Promise<InstalledPlugin | null> {
        const doc = await this.installedPluginModel.findOne({ _id: id, tenantId }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByPluginId(
        pluginId: string,
        tenantId: string,
    ): Promise<InstalledPlugin | null> {
        const doc = await this.installedPluginModel
            .findOne({ pluginId, tenantId })
            .exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findEnabledPlugins(tenantId: string): Promise<InstalledPlugin[]> {
        const docs = await this.installedPluginModel
            .find({ tenantId, status: InstalledPluginStatus.ENABLED })
            .exec();
        return docs.map((doc) => this.toDomain(doc));
    }

    async save(plugin: InstalledPlugin): Promise<InstalledPlugin> {
        // For new plugins (no id), create new document
        if (!plugin.id || plugin.id === '') {
            const doc = new this.installedPluginModel(this.toDocument(plugin));
            const saved = await doc.save();
            return this.toDomain(saved);
        }

        // For existing plugins, update by _id (don't include _id in update data)
        const updateData = this.toDocument(plugin);
        delete updateData._id; // Remove _id from update data

        const updated = await this.installedPluginModel
            .findByIdAndUpdate(plugin.id, updateData, { new: true })
            .exec();

        if (!updated) {
            throw new Error(`Failed to update installed plugin with id: ${plugin.id}`);
        }

        return this.toDomain(updated);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await this.installedPluginModel.findOneAndDelete({ _id: id, tenantId }).exec();
    }

    private toDomain(doc: any): InstalledPlugin {
        return new InstalledPlugin(
            doc._id.toString(),
            doc.tenantId,
            doc.pluginId,
            doc.version,
            doc.status as InstalledPluginStatus,
            doc.settings || {},
            doc.permissions || [],
            doc.installedAt,
            doc.enabledAt,
            doc.disabledAt,
            doc.lastError,
            doc.updatedAt,
        );
    }

    private toDocument(plugin: InstalledPlugin): any {
        return {
            tenantId: plugin.tenantId,
            pluginId: plugin.pluginId,
            version: plugin.version,
            status: plugin.status,
            settings: plugin.settings,
            permissions: plugin.permissions,
            installedAt: plugin.installedAt,
            enabledAt: plugin.enabledAt,
            disabledAt: plugin.disabledAt,
            lastError: plugin.lastError,
        };
    }
}
