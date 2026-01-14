/**
 * EditionService - Module Entitlement Management
 * 
 * Determines which modules are enabled for the current tenant based on edition.
 * Integrates with TenantService to provide reactive module access control.
 */

import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Observable, distinctUntilChanged, finalize, map, of, shareReplay, tap } from 'rxjs';
import { EditionFeaturesService } from './edition-features.service';
import { ModuleKey } from '../types/module-keys';

export interface EntitlementsSnapshot {
    tenantId: string;
    edition: {
        code: string;
        displayName: string;
        description?: string | null;
        version: number;
    } | null;
    modules: Record<ModuleKey, boolean>;
    features: Record<string, boolean>;
    limits?: {
        maxSchools?: number | null;
        maxUsers?: number | null;
        maxStudents?: number | null;
    };
    requiresEditionSelection: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class EditionService {
    private readonly editions = inject(EditionFeaturesService);
    private readonly http = inject(HttpClient);
    private readonly entitlements = signal<EntitlementsSnapshot | null>(null);
    private loadInFlight: Observable<EntitlementsSnapshot> | null = null;

    // Reactive enabled modules based on current tenant edition modules
    private readonly _enabledModules = computed<ReadonlySet<ModuleKey>>(() => {
        const snapshot = this.entitlements();
        if (snapshot?.modules) {
            const enabled = Object.keys(snapshot.modules)
                .filter((key) => snapshot.modules[key as ModuleKey]) as ModuleKey[];
            return new Set(enabled);
        }

        const featureSet = this.editions.features();
        return new Set(featureSet) as ReadonlySet<ModuleKey>;
    });

    loadEntitlements(): Observable<EntitlementsSnapshot> {
        const cached = this.entitlements();
        if (cached) {
            return of(cached);
        }
        if (this.loadInFlight) {
            return this.loadInFlight;
        }

        this.loadInFlight = this.http.get<EntitlementsSnapshot>('/api/entitlements/me').pipe(
            tap((snapshot) => {
                this.entitlements.set(snapshot);
                if (snapshot.edition) {
                    this.editions.setEdition({
                        editionCode: snapshot.edition.code,
                        editionName: snapshot.edition.displayName,
                        modules: Object.keys(snapshot.modules).filter(
                            (key) => snapshot.modules[key as ModuleKey],
                        ),
                        features: [],
                    });
                } else {
                    this.editions.clear();
                }
            }),
            shareReplay(1),
            finalize(() => {
                this.loadInFlight = null;
            }),
        );
        return this.loadInFlight;
    }

    currentEntitlements(): EntitlementsSnapshot | null {
        return this.entitlements();
    }

    clearEntitlements(): void {
        this.entitlements.set(null);
        this.editions.clear();
    }

    /**
     * Get currently enabled modules (synchronous)
     * @returns ReadonlySet of enabled module keys
     */
    enabledModules(): ReadonlySet<ModuleKey> {
        return this._enabledModules();
    }

    /**
     * Check if a specific module is enabled for current tenant
     * @param moduleKey The module to check
     * @returns true if module is enabled
     */
    isEnabled(moduleKey: ModuleKey): boolean {
        const enabled = this._enabledModules();
        return enabled.has(moduleKey);
    }

    /**
     * Check if a module is enabled (reactive Observable)
     * Useful for template subscriptions or reactive chains
     * @param moduleKey The module to check
     * @returns Observable<boolean> that emits when entitlement changes
     */
    isEnabled$(moduleKey: ModuleKey): Observable<boolean> {
        return toObservable(this._enabledModules).pipe(
            map((set) => set.has(moduleKey)),
            distinctUntilChanged()
        );
    }

    /**
     * Get the current tenant edition
     * @returns Edition code or null if no tenant
     */
    getCurrentEdition(): string | null {
        const snapshot = this.entitlements();
        if (snapshot?.edition?.code) {
            return snapshot.edition.code;
        }
        const code = this.editions.code();
        return code || null;
    }

    /**
     * Check if current edition includes a module
     * @param moduleKey Module to check
     * @returns true if edition includes module
     */
    isEditionIncluded(moduleKey: ModuleKey): boolean {
        return this.isEnabled(moduleKey);
    }

    /**
     * Get all modules available in a specific edition
     * @param edition The edition to query
     * @returns Set of modules available in that edition
     */
    getModulesForEdition(edition: string): ReadonlySet<ModuleKey> {
        if (this.editions.code() === edition) {
            return this._enabledModules();
        }
        return new Set<ModuleKey>();
    }

    /**
     * Compare current edition modules with a target edition
     * Useful for upgrade prompts
     * @param targetEdition Edition to compare against
     * @returns Array of additional modules available in target edition
     */
    getAdditionalModulesInEdition(targetEdition: string): ModuleKey[] {
        const currentModules = this._enabledModules();
        const targetModules = this.getModulesForEdition(targetEdition);

        return Array.from(targetModules).filter(mod => !currentModules.has(mod));
    }
}
