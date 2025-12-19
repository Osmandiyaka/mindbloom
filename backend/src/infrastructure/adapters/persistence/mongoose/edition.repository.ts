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
