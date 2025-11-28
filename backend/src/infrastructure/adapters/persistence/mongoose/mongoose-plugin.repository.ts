import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plugin, PluginCategory } from '@domain/plugin/entities/plugin.entity';
import { PluginRepository } from '@domain/ports/out/plugin-repository.port';

@Injectable()
export class MongoosePluginRepository implements PluginRepository {
    constructor(
        @InjectModel('Plugin') private readonly pluginModel: Model<any>,
    ) { }

    async findAll(): Promise<Plugin[]> {
        const docs = await this.pluginModel.find().exec();
        return docs.map((doc) => this.toDomain(doc)).filter(p => p !== null);
    }

    async findById(id: string): Promise<Plugin | null> {
        const doc = await this.pluginModel.findById(id).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByPluginId(pluginId: string): Promise<Plugin | null> {
        const doc = await this.pluginModel.findOne({ pluginId }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByCategory(category: string): Promise<Plugin[]> {
        const docs = await this.pluginModel
            .find({ category })
            .sort({ rating: -1, downloads: -1 })
            .exec();
        return docs.map((doc) => this.toDomain(doc));
    }

    async search(query: string): Promise<Plugin[]> {
        const docs = await this.pluginModel
            .find({
                $text: { $search: query },
            })
            .sort({ score: { $meta: 'textScore' } })
            .exec();
        return docs.map((doc) => this.toDomain(doc));
    }

    async save(plugin: Plugin): Promise<Plugin> {
        const existing = await this.pluginModel.findById(plugin.id).exec();

        if (existing) {
            const updated = await this.pluginModel
                .findByIdAndUpdate(plugin.id, this.toDocument(plugin), { new: true })
                .exec();
            return this.toDomain(updated);
        }

        const doc = new this.pluginModel(this.toDocument(plugin));
        const saved = await doc.save();
        return this.toDomain(saved);
    }

    async delete(id: string): Promise<void> {
        await this.pluginModel.findByIdAndDelete(id).exec();
    }

    private toDomain(doc: any): Plugin {
        if (!doc || !doc._id) {
            return null;
        }
        return new Plugin(
            doc._id.toString(),
            doc.pluginId,
            doc.name,
            doc.version,
            doc.description,
            doc.author,
            doc.category as PluginCategory,
            doc.status,
            doc.isOfficial,
            doc.iconUrl,
            doc.bannerUrl || '',
            doc.screenshots || [],
            doc.price || 0,
            doc.downloads || 0,
            doc.rating || 0,
            doc.ratingCount || 0,
            doc.manifest,
            doc.settings || {},
            doc.tags || [],
            doc.changelog || [],
            doc.createdAt,
            doc.updatedAt,
        );
    }

    private toDocument(plugin: Plugin): any {
        return {
            _id: plugin.id,
            pluginId: plugin.pluginId,
            name: plugin.name,
            version: plugin.version,
            description: plugin.description,
            author: plugin.author,
            category: plugin.category,
            status: plugin.status,
            isOfficial: plugin.isOfficial,
            iconUrl: plugin.iconUrl,
            bannerUrl: plugin.bannerUrl,
            screenshots: plugin.screenshots,
            price: plugin.price,
            downloads: plugin.downloads,
            rating: plugin.rating,
            ratingCount: plugin.ratingCount,
            manifest: plugin.manifest,
            settings: plugin.settings,
            tags: plugin.tags,
            changelog: plugin.changelog,
        };
    }
}
