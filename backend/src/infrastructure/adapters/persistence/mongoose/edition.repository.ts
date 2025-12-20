import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { EditionDocument } from './schemas/edition.schema';
import { EditionFeatureSettingDocument } from './schemas/edition-feature-setting.schema';
// import { Edition } from '../../../domain/edition/entities/edition.entity';
import { EditionFeatureAssignment, IEditionRepository } from '../../../../domain/ports/out/edition-repository.port';
import { Edition } from '@domain/edition/entities/edition.entity';

@Injectable()
export class MongooseEditionRepository implements IEditionRepository {
    constructor(
        @InjectModel('Edition') private readonly editionModel: Model<EditionDocument>,
        @InjectModel('EditionFeatureSetting') private readonly editionFeatureModel: Model<EditionFeatureSettingDocument>,
    ) { }

    async create(edition: Edition): Promise<Edition> {
        const created = await this.editionModel.create({
            name: edition.name,
            displayName: edition.displayName,
            description: edition.description,
            isActive: edition.isActive,
            sortOrder: edition.sortOrder,
            isFallback: false,
        });
        return this.toDomain(created);
    }

    async update(id: string, data: Partial<Edition>): Promise<Edition> {
        const updated = await this.editionModel.findByIdAndUpdate(id, {
            displayName: data.displayName,
            description: data.description,
            isActive: data.isActive,
            sortOrder: data.sortOrder,
        }, { new: true }).exec();
        if (!updated) {
            throw new Error('Edition not found');
        }
        return this.toDomain(updated);
    }

    async findById(id: string): Promise<Edition | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        const doc = await this.editionModel.findById(id).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByName(name: string): Promise<Edition | null> {
        const doc = await this.editionModel.findOne({ name }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findAll(): Promise<Edition[]> {
        const docs = await this.editionModel.find().sort({ sortOrder: 1, name: 1 }).exec();
        return docs.map(doc => this.toDomain(doc));
    }

    async replaceFeatures(editionId: string, assignments: EditionFeatureAssignment[]): Promise<void> {
        const session = await this.editionModel.db.startSession();
        await session.withTransaction(async () => {
            await this.editionFeatureModel.deleteMany({ editionId: new Types.ObjectId(editionId) }, { session }).exec();
            if (assignments.length) {
                const docs = assignments.map(a => ({
                    editionId: new Types.ObjectId(editionId),
                    featureKey: a.featureKey,
                    value: a.value,
                }));
                await this.editionFeatureModel.insertMany(docs, { session });
            }
        });
        session.endSession();
    }

    async getFeaturesMap(editionId: string): Promise<Record<string, string>> {
        const rows = await this.editionFeatureModel.find({ editionId: new Types.ObjectId(editionId) }).lean().exec();
        const map: Record<string, string> = {};
        for (const row of rows) {
            map[row.featureKey] = row.value;
        }
        return map;
    }

    async initializeGlobalEditions(): Promise<Edition[]> {
        const existing = await this.findAll();
        const { createGlobalEditions } = await import('../../../../domain/edition/entities/system-editions');
        const desired = createGlobalEditions();

        // Load canonical features once
        let canonical: Record<string, EditionFeatureAssignment[]> = {};
        try {
            const featuresMod = await import('../../../../domain/edition/entities/system-edition-features');
            canonical = featuresMod.createGlobalEditionFeatureAssignments();
        } catch (err) {
            // If features helper fails to load, we'll skip feature sync but continue
            // eslint-disable-next-line no-console
            console.warn('Failed to load canonical edition features', err?.stack || String(err));
        }

        const created: Edition[] = [];

        // Ensure each desired edition exists and matches current metadata
        for (const d of desired) {
            const found = await this.findByName(d.name);
            if (!found) {
                const c = await this.create(d);
                // Apply canonical features to newly created edition
                const assignments = canonical[d.name] ?? [];
                if (assignments.length) {
                    try {
                        await this.replaceFeatures(c.id, assignments);
                    } catch (err) {
                        // Don't block startup on feature assignment failure
                        // eslint-disable-next-line no-console
                        console.warn('Failed to apply features for new edition', d.name, err?.stack || String(err));
                    }
                }
                created.push(c);
                continue;
            }

            // If metadata differs, update it
            const needsUpdate =
                found.displayName !== d.displayName ||
                (found.description ?? null) !== (d.description ?? null) ||
                found.isActive !== d.isActive ||
                found.sortOrder !== d.sortOrder;

            if (needsUpdate) {
                await this.update(found.id, d as any);
            }

            // Ensure feature assignments are in sync with canonical definitions
            const assignments = canonical[d.name] ?? [];
            if (assignments.length) {
                try {
                    await this.replaceFeatures(found.id, assignments);
                } catch (err) {
                    // Log and continue - do not block startup if feature sync fails
                    // eslint-disable-next-line no-console
                    console.warn('Failed to sync edition features for', d.name, err?.stack || String(err));
                }
            }
        }

        // Return current list after ensuring presence
        return this.findAll();
    }

    private toDomain(doc: EditionDocument): Edition {
        return Edition.create({
            id: doc._id.toString(),
            name: doc.name,
            displayName: doc.displayName,
            description: doc.description,
            isActive: doc.isActive,
            sortOrder: doc.sortOrder,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }
}
