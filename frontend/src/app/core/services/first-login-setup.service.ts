import { Injectable } from '@angular/core';

export type FirstLoginSetupStatus = 'not_started' | 'in_progress' | 'skipped' | 'completed';

export interface FirstLoginSetupState {
    status: FirstLoginSetupStatus;
    step: number;
    startedAt?: string;
    skippedAt?: string;
    completedAt?: string;
    data?: Record<string, any>;
}

const STORAGE_PREFIX = 'mindbloom_first_login_setup';

@Injectable({
    providedIn: 'root'
})
export class FirstLoginSetupService {
    load(tenantId: string): FirstLoginSetupState | null {
        try {
            const raw = localStorage.getItem(this.key(tenantId));
            if (!raw) return null;
            return JSON.parse(raw) as FirstLoginSetupState;
        } catch {
            return null;
        }
    }

    save(tenantId: string, state: FirstLoginSetupState): void {
        try {
            localStorage.setItem(this.key(tenantId), JSON.stringify(state));
        } catch {
            // Storage errors are non-fatal.
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
