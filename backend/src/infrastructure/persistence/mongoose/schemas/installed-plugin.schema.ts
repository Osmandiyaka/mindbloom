import { Schema } from 'mongoose';
import { InstalledPluginStatus } from '@domain/plugin/entities/installed-plugin.entity';

export const InstalledPluginSchema = new Schema(
    {
        tenantId: { type: String, required: true, index: true },
        pluginId: { type: String, required: true, index: true },
        version: { type: String, required: true },
        status: {
            type: String,
            enum: Object.values(InstalledPluginStatus),
            default: InstalledPluginStatus.INSTALLED
        },
        settings: { type: Schema.Types.Mixed, default: {} },
        permissions: [{ type: String }],
        installedAt: { type: Date, default: Date.now },
        enabledAt: { type: Date },
        disabledAt: { type: Date },
        lastError: { type: String },
    },
    {
        timestamps: true,
        collection: 'installed_plugins',
    },
);

// Ensure a plugin can only be installed once per tenant
InstalledPluginSchema.index({ tenantId: 1, pluginId: 1 }, { unique: true });
InstalledPluginSchema.index({ tenantId: 1, status: 1 });
