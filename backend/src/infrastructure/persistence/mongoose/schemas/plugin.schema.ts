import { Schema } from 'mongoose';
import { PluginCategory, PluginStatus } from '@domain/plugin/entities/plugin.entity';

export const PluginSchema = new Schema(
    {
        pluginId: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        version: { type: String, required: true },
        description: { type: String, required: true },
        author: { type: String, required: true },
        category: {
            type: String,
            enum: Object.values(PluginCategory),
            required: true,
            index: true
        },
        status: {
            type: String,
            enum: Object.values(PluginStatus),
            default: PluginStatus.AVAILABLE
        },
        isOfficial: { type: Boolean, default: false },
        iconUrl: { type: String, required: true },
        bannerUrl: { type: String, default: '' },
        screenshots: [{ type: String }],
        price: { type: Number, default: 0 },
        downloads: { type: Number, default: 0 },
        rating: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 },
        manifest: { type: Schema.Types.Mixed, required: true },
        settings: { type: Schema.Types.Mixed, default: {} },
        tags: [{ type: String }],
        changelog: [{
            version: String,
            date: Date,
            changes: [String]
        }],
    },
    {
        timestamps: true,
        collection: 'plugins',
    },
);

// Indexes for better query performance
PluginSchema.index({ name: 'text', description: 'text', tags: 'text' });
PluginSchema.index({ category: 1, rating: -1 });
PluginSchema.index({ downloads: -1 });
