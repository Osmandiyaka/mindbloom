import { Injectable } from '@angular/core';

export type OnboardingStep = 1 | 2 | 3 | 4;

export interface OnboardingOrgState {
    country?: string;
    city?: string;
    addressLine?: string;
    domain?: string;
    timezone?: string;
    locale?: string;
}

export interface OnboardingSchoolRow {
    id?: string;
    name: string;
    code?: string;
    existing?: boolean;
}

export interface OnboardingSchoolsState {
    mode: 'single' | 'multi';
    rows: OnboardingSchoolRow[];
}

export interface OnboardingEditionState {
    id?: string;
    name?: string;
}

export interface OnboardingAdminState {
    createExtraAdmin: boolean;
    name?: string;
    email?: string;
    password?: string;
}

export interface TenantOnboardingState {
    step: OnboardingStep;
    org: OnboardingOrgState;
    schools: OnboardingSchoolsState;
    edition: OnboardingEditionState;
    admin: OnboardingAdminState;
    completed: boolean;
}

const STORAGE_PREFIX = 'mindbloom_onboarding';

@Injectable({
    providedIn: 'root'
})
export class TenantOnboardingService {
    load(tenantId: string): TenantOnboardingState | null {
        try {
            const raw = localStorage.getItem(this.key(tenantId));
            if (!raw) return null;
            return JSON.parse(raw) as TenantOnboardingState;
        } catch {
            return null;
        }
    }

    save(tenantId: string, state: TenantOnboardingState): void {
        try {
            localStorage.setItem(this.key(tenantId), JSON.stringify(state));
        } catch {
            // Ignore storage errors; onboarding still functions in-memory.
        }
    }

    clear(tenantId: string): void {
        try {
            localStorage.removeItem(this.key(tenantId));
        } catch {
            // Ignore storage errors.
        }
    }

    private key(tenantId: string): string {
        return `${STORAGE_PREFIX}:${tenantId}`;
    }
}
