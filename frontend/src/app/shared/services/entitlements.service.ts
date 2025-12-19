/**
 * EntitlementsService - Module Entitlement Management
 * 
 * Determines which modules are enabled for the current tenant based on subscription plan.
 * Integrates with TenantService to provide reactive module access control.
 */

import { Injectable, computed, signal, inject } from '@angular/core';
import { Observable, map, distinctUntilChanged, of } from 'rxjs';
import { TenantService, TenantPlan } from '../../core/services/tenant.service';
import { ModuleKey, MODULE_KEYS } from '../types/module-keys';

/**
 * Plan-based module entitlements mapping
 * Each plan defines which modules are accessible
 */
const PLAN_ENTITLEMENTS: Record<TenantPlan, ReadonlySet<ModuleKey>> = {
    trial: new Set([
        MODULE_KEYS.DASHBOARD,
        MODULE_KEYS.STUDENTS,
        MODULE_KEYS.ADMISSIONS,
        MODULE_KEYS.ACADEMICS,
        MODULE_KEYS.ATTENDANCE,
        MODULE_KEYS.SETUP
    ]),
    free: new Set([
        MODULE_KEYS.DASHBOARD,
        MODULE_KEYS.STUDENTS,
        MODULE_KEYS.SETUP
    ]),
    basic: new Set([
        MODULE_KEYS.DASHBOARD,
        MODULE_KEYS.STUDENTS,
        MODULE_KEYS.ADMISSIONS,
        MODULE_KEYS.ACADEMICS,
        MODULE_KEYS.ATTENDANCE,
        MODULE_KEYS.SETUP
    ]),
    premium: new Set([
        MODULE_KEYS.DASHBOARD,
        MODULE_KEYS.STUDENTS,
        MODULE_KEYS.ADMISSIONS,
        MODULE_KEYS.ACADEMICS,
        MODULE_KEYS.ATTENDANCE,
        MODULE_KEYS.FEES,
        MODULE_KEYS.ACCOUNTING,
        MODULE_KEYS.FINANCE,
        MODULE_KEYS.LIBRARY,
        MODULE_KEYS.TASKS,
        MODULE_KEYS.SETUP,
        MODULE_KEYS.PLUGINS
    ]),
    enterprise: new Set([
        MODULE_KEYS.DASHBOARD,
        MODULE_KEYS.STUDENTS,
        MODULE_KEYS.ADMISSIONS,
        MODULE_KEYS.ACADEMICS,
        MODULE_KEYS.ATTENDANCE,
        MODULE_KEYS.FEES,
        MODULE_KEYS.ACCOUNTING,
        MODULE_KEYS.FINANCE,
        MODULE_KEYS.HR,
        MODULE_KEYS.PAYROLL,
        MODULE_KEYS.LIBRARY,
        MODULE_KEYS.HOSTEL,
        MODULE_KEYS.TRANSPORT,
        MODULE_KEYS.ROLES,
        MODULE_KEYS.TASKS,
        MODULE_KEYS.SETUP,
        MODULE_KEYS.PLUGINS
    ])
};

@Injectable({
    providedIn: 'root'
})
export class EntitlementsService {
    private readonly tenantService = inject(TenantService);

    // Reactive enabled modules based on current tenant plan
    private readonly _enabledModules = computed(() => {
        const tenant = this.tenantService.currentTenant();
        if (!tenant) {
            // No tenant = no modules enabled (except public routes)
            return new Set<ModuleKey>([MODULE_KEYS.DASHBOARD]);
        }

        // Use custom enabledModules if defined, otherwise use plan-based defaults
        if (tenant.enabledModules && tenant.enabledModules.length > 0) {
            return new Set(tenant.enabledModules as ModuleKey[]);
        }

        return PLAN_ENTITLEMENTS[tenant.plan] || new Set([MODULE_KEYS.DASHBOARD]);
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
        return this.tenantService.currentTenant$.pipe(
            map(tenant => {
                if (!tenant) return false;

                // Check custom enabledModules first
                if (tenant.enabledModules && tenant.enabledModules.length > 0) {
                    return tenant.enabledModules.includes(moduleKey);
                }

                // Fall back to plan-based entitlements
                const planModules = PLAN_ENTITLEMENTS[tenant.plan];
                return planModules?.has(moduleKey) || false;
            }),
            distinctUntilChanged()
        );
    }

    /**
     * Refresh entitlements from backend
     * TODO: Implement API call to fetch latest tenant subscription/plan
     * For now, this re-fetches the tenant which triggers entitlement recalculation
     */
    async refresh(): Promise<void> {
        const tenant = this.tenantService.getCurrentTenantValue();
        if (!tenant?.id) {
            console.warn('[Entitlements] Cannot refresh: no active tenant');
            return;
        }

        try {
            // Re-fetch tenant to get latest plan/enabledModules
            const updatedTenant = await this.tenantService.getTenantById(tenant.id).toPromise();
            if (updatedTenant) {
                this.tenantService.setTenant(updatedTenant);
                console.log('[Entitlements] Refreshed for plan:', updatedTenant.plan);
            }
        } catch (error) {
            console.error('[Entitlements] Refresh failed:', error);
            throw error;
        }
    }

    /**
     * Get the current tenant plan
     * @returns TenantPlan or null if no tenant
     */
    getCurrentPlan(): TenantPlan | null {
        const tenant = this.tenantService.getCurrentTenantValue();
        return tenant?.plan || null;
    }

    /**
     * Check if current plan includes a module
     * This is plan-based only, ignoring custom enabledModules overrides
     * @param moduleKey Module to check
     * @returns true if plan includes module
     */
    isPlanIncluded(moduleKey: ModuleKey): boolean {
        const plan = this.getCurrentPlan();
        if (!plan) return false;

        const planModules = PLAN_ENTITLEMENTS[plan];
        return planModules?.has(moduleKey) || false;
    }

    /**
     * Get all modules available in a specific plan
     * @param plan The plan to query
     * @returns Set of modules available in that plan
     */
    getModulesForPlan(plan: TenantPlan): ReadonlySet<ModuleKey> {
        return PLAN_ENTITLEMENTS[plan] || new Set();
    }

    /**
     * Compare current plan modules with a target plan
     * Useful for upgrade prompts
     * @param targetPlan Plan to compare against
     * @returns Array of additional modules available in target plan
     */
    getAdditionalModulesInPlan(targetPlan: TenantPlan): ModuleKey[] {
        const currentModules = this._enabledModules();
        const targetModules = this.getModulesForPlan(targetPlan);

        return Array.from(targetModules).filter(mod => !currentModules.has(mod));
    }
}
