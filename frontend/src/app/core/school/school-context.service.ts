import { Injectable, signal, effect } from '@angular/core';
import { School } from './school.models';
import { SchoolService } from './school.service';
import { TenantContextService } from '../tenant/tenant-context.service';

const STORAGE_KEY = 'mindbloom_school_id';

@Injectable({
    providedIn: 'root'
})
export class SchoolContextService {
    readonly schools = signal<School[]>([]);
    readonly activeSchool = signal<School | null>(null);
    readonly isLoading = signal(false);

    constructor(
        private schoolService: SchoolService,
        private tenantContext: TenantContextService
    ) {
        let lastTenantId: string | null = null;

        effect(() => {
            const tenantId = this.tenantContext.activeTenantId();

            if (!tenantId) {
                lastTenantId = null;
                this.clear();
                return;
            }

            if (tenantId === lastTenantId) {
                return;
            }

            lastTenantId = tenantId;
            this.refreshSchools();
        }, { allowSignalWrites: true });
    }

    refreshSchools(): void {
        this.isLoading.set(true);

        this.schoolService.listSchools().subscribe({
            next: (schools) => {
                const list = Array.isArray(schools) ? schools : [];
                this.schools.set(list);
                const resolved = this.resolveActiveSchool(list);
                this.setActiveSchool(resolved);
            },
            error: (error) => {
                console.warn('[SchoolContext] Failed to load schools', error);
                this.schools.set([]);
                this.setActiveSchool(null);
            },
            complete: () => {
                this.isLoading.set(false);
            }
        });
    }

    setActiveSchool(school: School | null): void {
        const current = this.activeSchool();
        if (current?.id === school?.id) {
            return;
        }

        this.activeSchool.set(school);

        try {
            if (school?.id) {
                localStorage.setItem(STORAGE_KEY, school.id);
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (error) {
            console.warn('[SchoolContext] Failed to persist active school', error);
        }
    }

    private resolveActiveSchool(schools: School[]): School | null {
        if (!schools.length) {
            return null;
        }

        const storedId = this.loadStoredSchoolId();
        if (storedId) {
            const stored = schools.find((school) => school.id === storedId);
            if (stored) {
                return stored;
            }
        }

        return schools[0] ?? null;
    }

    private loadStoredSchoolId(): string | null {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            console.warn('[SchoolContext] Failed to load stored school id', error);
            return null;
        }
    }

    private clear(): void {
        this.schools.set([]);
        this.activeSchool.set(null);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.warn('[SchoolContext] Failed to clear stored school id', error);
        }
    }
}
