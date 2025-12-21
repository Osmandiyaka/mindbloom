import { Injectable, computed, signal } from '@angular/core';
import { ModuleKey } from '../types/module-keys';

export interface EditionSnapshot {
    editionCode: string;
    editionName: string;
    /**
     * Preferred shape from backend: list of module keys enabled for the edition.
     * Kept alongside legacy `features` for backward compatibility.
     */
    modules?: string[];
    /**
     * Legacy property; still accepted to avoid breaking older responses.
     */
    features?: string[];
}

@Injectable({ providedIn: 'root' })
export class EditionFeaturesService {
    private readonly edition = signal<string | null>(null);
    private readonly editionName = signal<string | null>(null);
    private readonly featureSet = signal<Set<ModuleKey>>(new Set());

    readonly features = computed(() => this.featureSet());
    readonly code = computed(() => this.edition());
    readonly name = computed(() => this.editionName());

    setEdition(snapshot: EditionSnapshot | null): void {
        if (!snapshot) {
            this.clear();
            return;
        }
        this.edition.set(snapshot.editionCode);
        this.editionName.set(snapshot.editionName);
        const moduleKeys = this.selectModules(snapshot);
        this.featureSet.set(new Set(moduleKeys));
    }

    clear(): void {
        this.edition.set(null);
        this.editionName.set(null);
        this.featureSet.set(new Set());
    }

    hasFeature(featureKey: string): boolean {
        return this.featureSet().has(featureKey as ModuleKey);
    }

    private selectModules(snapshot: EditionSnapshot): ModuleKey[] {
        const preferred = snapshot.modules && snapshot.modules.length ? snapshot.modules : snapshot.features || [];
        // Normalize to ModuleKey string literals and drop duplicates
        const normalized = preferred
            .filter(Boolean)
            .map(k => k.trim())
            .filter(k => k.length) as string[];
        return Array.from(new Set(normalized)) as ModuleKey[];
    }
}
