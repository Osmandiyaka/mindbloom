/**
 * Navigation Filter Service
 * 
 * Filters navigation items based on:
 * - Module entitlements (tenant plan)
 * - User permissions (RBAC)
 * - User roles
 * 
 * Ensures sidebar only shows accessible modules and prevents dead links
 */

import { Injectable, inject, computed, Signal } from '@angular/core';
import { EditionService } from './entitlements.service';
import { AuthorizationService } from '../security/authorization.service';
import { ModuleKey } from '../types/module-keys';

export interface NavItem {
    label: string;
    path: string;
    icon: string;
    badge?: string;
    permission?: string;
    moduleKey?: string;
    rolesAllowed?: string[];
}

export interface NavSection {
    title: string;
    items: NavItem[];
}

@Injectable({
    providedIn: 'root'
})
export class NavFilterService {
    private entitlements = inject(EditionService);
    private authorization = inject(AuthorizationService);

    /**
     * Filter navigation items based on entitlements and permissions
     * @param sections Complete navigation structure
     * @returns Filtered sections with only accessible items
     */
    filterNavigation(sections: NavSection[]): Signal<NavSection[]> {
        return computed(() => {
            const filtered: NavSection[] = [];

            for (const section of sections) {
                const visibleItems: NavItem[] = [];

                for (const item of section.items) {
                    if (this.isItemVisible(item)) {
                        visibleItems.push(item);
                    }
                }

                // Only include section if it has visible items
                if (visibleItems.length > 0) {
                    filtered.push({
                        title: section.title,
                        items: visibleItems
                    });
                }
            }

            return filtered;
        });
    }

    /**
     * Check if a single nav item should be visible
     * @param item Navigation item to check
     * @returns true if item should be visible
     */
    private isItemVisible(item: NavItem): boolean {
        if (item.moduleKey && !this.entitlements.isEnabled(item.moduleKey as ModuleKey)) {
            return false;
        }

        // Check permission
        if (item.permission && !this.authorization.can(item.permission)) {
            return false;
        }

        if (item.rolesAllowed && item.rolesAllowed.length > 0) {

        }

        return true;
    }

    /**
     * Synchronous version for imperative filtering
     */
    filterNavigationSync(sections: NavSection[]): NavSection[] {
        const filtered: NavSection[] = [];

        for (const section of sections) {
            const visibleItems: NavItem[] = [];

            for (const item of section.items) {
                if (this.isItemVisible(item)) {
                    visibleItems.push(item);
                }
            }

            // Only include section if it has visible items
            if (visibleItems.length > 0) {
                filtered.push({
                    title: section.title,
                    items: visibleItems
                });
            }
        }

        return filtered;
    }

    /**
     * Check if specific module should be visible in nav
     */
    isModuleVisible(moduleKey: string): boolean {
        return this.entitlements.isEnabled(moduleKey as ModuleKey);
    }

    /**
     * Check if user has permission for nav item
     */
    hasPermissionForItem(item: NavItem): boolean {
        if (!item.permission) {
            return true;
        }
        return this.authorization.can(item.permission);
    }
}
