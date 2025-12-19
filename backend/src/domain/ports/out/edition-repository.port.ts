import { Edition } from '../../edition/entities/edition.entity';

export interface EditionFeatureAssignment {
    featureKey: string;
    value: string;
}

export interface IEditionRepository {
    create(edition: Edition): Promise<Edition>;
    update(id: string, data: Partial<Edition>): Promise<Edition>;
    findById(id: string): Promise<Edition | null>;
    findByName(name: string): Promise<Edition | null>;
    replaceFeatures(editionId: string, assignments: EditionFeatureAssignment[]): Promise<void>;
    getFeaturesMap(editionId: string): Promise<Record<string, string>>;
}
