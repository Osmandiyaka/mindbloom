/**
 * EditionService - Module Entitlement Management
 * 
 * Determines which modules are enabled for the current tenant based on edition.
 * Integrates with TenantService to provide reactive module access control.
 */

import { Injectable, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, distinctUntilChanged, map } from 'rxjs';
import { EditionFeaturesService } from './edition-features.service';
import { ModuleKey } from '../types/module-keys';

@Injectable({
    providedIn: 'root'
})
export class EditionService {
    private readonly editions = inject(EditionFeaturesService);

    // Reactive enabled modules based on current tenant edition modules
    private readonly _enabledModules = computed<ReadonlySet<ModuleKey>>(() => {
        const featureSet = this.editions.features();
        return new Set(featureSet) as ReadonlySet<ModuleKey>;
    });

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
