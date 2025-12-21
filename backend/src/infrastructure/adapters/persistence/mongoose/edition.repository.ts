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
            monthlyPrice: edition.monthlyPrice ?? null,
            annualPrice: edition.annualPrice ?? null,
            perStudentMonthly: edition.perStudentMonthly ?? null,
            annualPriceNotes: edition.annualPriceNotes ?? null,
            modules: edition.modules ?? [],
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
            monthlyPrice: (data as any).monthlyPrice ?? null,
            annualPrice: (data as any).annualPrice ?? null,
            perStudentMonthly: (data as any).perStudentMonthly ?? null,
            annualPriceNotes: (data as any).annualPriceNotes ?? null,
            modules: (data as any).modules,
            isActive: data.isActive,
            sortOrder: data.sortOrder,
            updatedAt: new Date(),
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
        // Try to use transactions where supported (replica set), but fall back to non-transactional operations
        // for single-node/local MongoDB instances (which don't support transactions).
        const session = await this.editionModel.db.startSession();
        let usedTransaction = false;
        try {
            await session.withTransaction(async () => {
                usedTransaction = true;
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
        } catch (err: any) {
            // If transactions are not supported (e.g., standalone Mongo), fall back to plain operations
            const msg = String(err.message || err);
            if (msg.includes('Transaction numbers are only allowed') || msg.includes('transactions are not supported')) {
                // eslint-disable-next-line no-console
                console.warn('Transactions not supported by MongoDB deployment, falling back to non-transactional feature replacement');
                await this.editionFeatureModel.deleteMany({ editionId: new Types.ObjectId(editionId) }).exec();
                if (assignments.length) {
                    const docs = assignments.map(a => ({
                        editionId: new Types.ObjectId(editionId),
                        featureKey: a.featureKey,
                        value: a.value,
                    }));
                    await this.editionFeatureModel.insertMany(docs);
                }
            } else {
                throw err;
            }
        } finally {
            try { session.endSession(); } catch (e) { /* ignore */ }
        }
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

            // If metadata or pricing differs, update it
            const needsUpdate =
                found.displayName !== d.displayName ||
                (found.description ?? null) !== (d.description ?? null) ||
                found.isActive !== d.isActive ||
                found.sortOrder !== d.sortOrder ||
                (found as any).monthlyPrice !== (d as any).monthlyPrice ||
                (found as any).annualPrice !== (d as any).annualPrice ||
                (found as any).perStudentMonthly !== (d as any).perStudentMonthly ||
                (found as any).annualPriceNotes !== (d as any).annualPriceNotes;

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
            monthlyPrice: doc.monthlyPrice ?? null,
            annualPrice: doc.annualPrice ?? null,
            perStudentMonthly: doc.perStudentMonthly ?? null,
            annualPriceNotes: doc.annualPriceNotes ?? null,
            modules: doc.modules ?? [],
            isActive: doc.isActive,
            sortOrder: doc.sortOrder,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }
}
