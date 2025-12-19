import { Injectable, computed, signal } from '@angular/core';

export interface EditionSnapshot {
    editionCode: string;
    editionName: string;
    features: string[];
}

@Injectable({ providedIn: 'root' })
export class EditionFeaturesService {
    private readonly edition = signal<string | null>(null);
    private readonly editionName = signal<string | null>(null);
    private readonly featureSet = signal<Set<string>>(new Set());

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
        this.featureSet.set(new Set(snapshot.features || []));
    }

    clear(): void {
        this.edition.set(null);
        this.editionName.set(null);
        this.featureSet.set(new Set());
    }

    hasFeature(featureKey: string): boolean {
        return this.featureSet().has(featureKey);
    }
}
