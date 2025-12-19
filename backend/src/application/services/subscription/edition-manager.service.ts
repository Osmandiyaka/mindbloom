import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { Edition } from '../../../domain/edition/entities/edition.entity';
import { EditionFeatureAssignment, IEditionRepository } from '../../../domain/ports/out/edition-repository.port';
import { EDITION_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { DuplicateEditionNameException } from '../../../domain/exceptions/duplicate-edition-name.exception';
import { UnknownFeatureKeyException } from '../../../domain/exceptions/unknown-feature-key.exception';
import { InvalidFeatureValueException } from '../../../domain/exceptions/invalid-feature-value.exception';
import { FeatureCatalog } from '../../../domain/features/feature-catalog';
import { FeatureValueParser } from '../../../domain/features/feature-value-parser';
import { FeatureValidationService } from '../features/feature-validation.service';

export interface CreateEditionInput {
    name: string;
    displayName: string;
    description?: string | null;
    isActive?: boolean;
    sortOrder?: number;
}

export interface UpdateEditionInput {
    displayName?: string;
    description?: string | null;
    isActive?: boolean;
    sortOrder?: number;
}

interface CacheEntry {
    expiresAt: number;
    value: Record<string, string>;
}

@Injectable()
export class EditionManager {
    private readonly cache = new Map<string, CacheEntry>();
    private readonly ttlMs = 5 * 60 * 1000; // 5 minutes

    constructor(
        @Inject(EDITION_REPOSITORY)
        private readonly editions: IEditionRepository,
        private readonly featureValidator: FeatureValidationService,
    ) { }

    async createEdition(input: CreateEditionInput): Promise<Edition> {
        const name = input.name?.trim();
        if (!name) throw new Error('Edition name is required');
        const normalized = name.toLowerCase();

        const existing = await this.editions.findByName(normalized);
        if (existing) {
            throw new DuplicateEditionNameException(normalized);
        }

        const displayName = input.displayName?.trim();
        if (!displayName) throw new Error('Edition displayName is required');
        const sortOrder = input.sortOrder ?? 0;
        if (sortOrder < 0) throw new Error('sortOrder must be >= 0');

        const edition = Edition.create({
            id: new Types.ObjectId().toHexString(),
            name: normalized,
            displayName,
            description: input.description ?? null,
            isActive: input.isActive ?? true,
            sortOrder,
        });

        return this.editions.create(edition);
    }

    async updateEdition(editionId: string, input: UpdateEditionInput): Promise<Edition> {
        const existing = await this.editions.findById(editionId);
        if (!existing) {
            throw new Error('Edition not found');
        }

        const update: UpdateEditionInput = {};
        if (input.displayName !== undefined) {
            const trimmed = input.displayName?.trim();
            if (!trimmed) throw new Error('Edition displayName is required');
            update.displayName = trimmed;
        }
        if (input.description !== undefined) update.description = input.description ?? null;
        if (input.isActive !== undefined) update.isActive = input.isActive;
        if (input.sortOrder !== undefined) {
            if (input.sortOrder < 0) throw new Error('sortOrder must be >= 0');
            update.sortOrder = input.sortOrder;
        }

        const updated = await this.editions.update(editionId, update as any);
        this.invalidateCache(editionId);
        return updated;
    }

    async getEditionWithFeatures(editionId: string): Promise<{ edition: Edition; features: Record<string, string> }> {
        const edition = await this.editions.findById(editionId);
        if (!edition) throw new Error('Edition not found');
        const features = await this.getFeatureMapCached(editionId);
        return { edition, features };
    }

    async setEditionFeatures(editionId: string, assignments: EditionFeatureAssignment[]): Promise<void> {
        const edition = await this.editions.findById(editionId);
        if (!edition) throw new Error('Edition not found');

        this.featureValidator.validateAssignments(assignments);
        const normalizedAssignments = this.normalizeAssignments(assignments);
        const withParents = this.ensureParents(normalizedAssignments);

        await this.editions.replaceFeatures(editionId, withParents);
        this.invalidateCache(editionId);
    }

    private normalizeAssignments(assignments: EditionFeatureAssignment[]): EditionFeatureAssignment[] {
        const map = new Map<string, EditionFeatureAssignment>();
        for (const a of assignments) {
            const key = a.featureKey?.trim();
            if (!key) continue;
            const def = FeatureCatalog.tryGet(key);
            if (!def) {
                throw new UnknownFeatureKeyException(key);
            }
            try {
                FeatureValueParser.validateValue(def.valueType, a.value, key);
            } catch (err) {
                if (err instanceof InvalidFeatureValueException) throw err;
                throw new InvalidFeatureValueException(key, def.valueType, a.value);
            }
            map.set(def.key, { featureKey: def.key, value: a.value });
        }
        return Array.from(map.values());
    }

    private ensureParents(assignments: EditionFeatureAssignment[]): EditionFeatureAssignment[] {
        const map = new Map<string, EditionFeatureAssignment>(assignments.map(a => [a.featureKey, a]));
        for (const a of assignments) {
            const def = FeatureCatalog.get(a.featureKey);
            if (def.parentKey) {
                const parent = FeatureCatalog.get(def.parentKey);
                if (!map.has(parent.key)) {
                    map.set(parent.key, { featureKey: parent.key, value: parent.defaultValue });
                }
            }
        }
        return Array.from(map.values());
    }

    private async getFeatureMapCached(editionId: string): Promise<Record<string, string>> {
        const cached = this.cache.get(editionId);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.value;
        }
        const value = await this.editions.getFeaturesMap(editionId);
        this.cache.set(editionId, { value, expiresAt: Date.now() + this.ttlMs });
        return value;
    }

    private invalidateCache(editionId: string): void {
        this.cache.delete(editionId);
    }
}
