import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AcademicsApiService, ApiEnvelope, ApiErrorShape, ClassConfigDto, ClassDto, GradeDto, SectionDto } from '../../../core/services/academics-api.service';

export type AcademicsFilters = {
    schoolId?: string;
    academicYearId?: string;
    gradeId?: string;
    status?: 'active' | 'archived';
};

export type SectionFilters = {
    status?: 'active' | 'archived';
    search?: string;
};

@Injectable()
export class AcademicsStore {
    private readonly api = inject(AcademicsApiService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    classConfig = signal<ClassConfigDto | null>(null);
    grades = signal<GradeDto[]>([]);
    classes = signal<ClassDto[]>([]);
    sections = signal<SectionDto[]>([]);

    selectedClassId = signal<string | null>(null);
    selectedClass = computed(() => {
        const id = this.selectedClassId();
        if (!id) return null;
        return this.classes().find(row => row.id === id) || null;
    });

    search = signal('');
    filters = signal<AcademicsFilters>({ status: 'active' });
    sectionsFilters = signal<SectionFilters>({ status: 'active' });

    classesLoading = signal(false);
    sectionsLoading = signal(false);
    gradesLoading = signal(false);
    configLoading = signal(false);

    classesError = signal<ApiErrorShape | null>(null);
    sectionsError = signal<ApiErrorShape | null>(null);
    gradesError = signal<ApiErrorShape | null>(null);
    configError = signal<ApiErrorShape | null>(null);

    menuOpenId = signal<string | null>(null);
    sectionsMenuOpen = signal(false);

    selectedClassSectionsCount = computed(() => {
        const classId = this.selectedClassId();
        if (!classId) return 0;
        return this.sections().filter(section => section.classId === classId).length;
    });

    canShowRightPanel = computed(() => !!this.selectedClassId());

    leftListItems = computed(() => this.classes().map(row => ({
        ...row,
        sectionsCount: row.sectionsCount ?? 0,
    })));

    constructor() {
        effect(() => {
            const selectedId = this.selectedClassId();
            if (selectedId) {
                this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: { classId: selectedId },
                    queryParamsHandling: 'merge',
                    replaceUrl: true,
                });
                this.loadSectionsForSelectedClass();
            } else {
                this.sections.set([]);
            }
        }, { allowSignalWrites: true });
    }

    initFromRoute(): void {
        const classId = this.route.snapshot.queryParamMap.get('classId');
        if (classId) {
            this.selectedClassId.set(classId);
        }
    }

    loadConfig(): void {
        this.configLoading.set(true);
        this.configError.set(null);
        this.api.getClassConfig().subscribe({
            next: (response: ApiEnvelope<ClassConfigDto>) => this.classConfig.set(response.data ?? null),
            error: (error: ApiErrorShape) => {
                this.configError.set(error);
                this.configLoading.set(false);
            },
            complete: () => this.configLoading.set(false),
        });
    }

    loadGrades(): void {
        this.gradesLoading.set(true);
        this.gradesError.set(null);
        const filters = this.filters();
        this.api.listGrades({
            schoolId: filters.schoolId,
            status: filters.status,
            search: undefined,
            page: 1,
            pageSize: 200,
        }).subscribe({
            next: (response: ApiEnvelope<GradeDto[]>) => this.grades.set(response.data ?? []),
            error: (error: ApiErrorShape) => {
                this.gradesError.set(error);
                this.gradesLoading.set(false);
            },
            complete: () => this.gradesLoading.set(false),
        });
    }

    loadClasses(): void {
        this.classesLoading.set(true);
        this.classesError.set(null);
        const filters = this.filters();
        this.api.listClasses({
            schoolId: filters.schoolId,
            academicYearId: filters.academicYearId,
            gradeId: filters.gradeId,
            status: filters.status,
            search: this.search().trim() || undefined,
            includeCounts: true,
            page: 1,
            pageSize: 200,
        }).subscribe({
            next: (response: ApiEnvelope<ClassDto[]>) => {
                this.classes.set(response.data ?? []);
                const current = untracked(this.selectedClassId);
                if (current && (response.data ?? []).some(row => row.id === current)) {
                    return;
                }
                const fallback = response.data?.[0]?.id ?? null;
                this.selectedClassId.set(fallback);
            },
            error: (error: ApiErrorShape) => {
                this.classesError.set(error);
                this.classesLoading.set(false);
            },
            complete: () => this.classesLoading.set(false),
        });
    }

    selectClass(classId: string): void {
        this.selectedClassId.set(classId);
    }

    loadSectionsForSelectedClass(): void {
        const classId = this.selectedClassId();
        if (!classId) return;
        this.sectionsLoading.set(true);
        this.sectionsError.set(null);
        const filters = this.sectionsFilters();
        this.api.listSectionsByClass(classId, {
            status: filters.status,
            search: filters.search,
            page: 1,
            pageSize: 200,
        }).subscribe({
            next: (response: ApiEnvelope<SectionDto[]>) => this.sections.set(response.data ?? []),
            error: (error: ApiErrorShape) => {
                this.sectionsError.set(error);
                this.sectionsLoading.set(false);
            },
            complete: () => this.sectionsLoading.set(false),
        });
    }

    createClass(
        payload: { name: string; code?: string | null; schoolIds: string[]; academicYearId?: string | null; gradeId?: string | null; },
        callbacks?: { onSuccess?: () => void; onError?: (error: ApiErrorShape) => void; onComplete?: () => void }
    ): void {
        this.api.createClass(payload).subscribe({
            next: () => {
                this.loadClasses();
                callbacks?.onSuccess?.();
            },
            error: (error: ApiErrorShape) => {
                this.classesError.set(error);
                callbacks?.onError?.(error);
                callbacks?.onComplete?.();
            },
            complete: () => callbacks?.onComplete?.(),
        });
    }

    updateClass(
        classId: string,
        patch: { name?: string; code?: string | null; schoolIds?: string[]; academicYearId?: string | null; gradeId?: string | null; status?: 'active' | 'archived'; },
        callbacks?: { onSuccess?: () => void; onError?: (error: ApiErrorShape) => void; onComplete?: () => void }
    ): void {
        this.api.updateClass(classId, patch).subscribe({
            next: () => {
                this.loadClasses();
                callbacks?.onSuccess?.();
            },
            error: (error: ApiErrorShape) => {
                this.classesError.set(error);
                callbacks?.onError?.(error);
                callbacks?.onComplete?.();
            },
            complete: () => callbacks?.onComplete?.(),
        });
    }

    archiveClass(classId: string, confirmationText?: string, onSuccess?: () => void, onError?: (error: ApiErrorShape) => void): void {
        this.api.archiveClass(classId, confirmationText).subscribe({
            next: () => {
                this.loadClasses();
                onSuccess?.();
            },
            error: (error: ApiErrorShape) => {
                this.classesError.set(error);
                onError?.(error);
            },
        });
    }

    restoreClass(classId: string): void {
        this.api.restoreClass(classId).subscribe({
            next: () => this.loadClasses(),
            error: (error: ApiErrorShape) => this.classesError.set(error),
        });
    }

    getClassArchiveImpact(classId: string, onSuccess: (impact: { sectionsCount?: number }) => void, onError?: (error: ApiErrorShape) => void): void {
        this.api.getClassArchiveImpact(classId).subscribe({
            next: (response: ApiEnvelope<{ sectionsCount?: number }>) => onSuccess(response.data ?? {}),
            error: (error: ApiErrorShape) => {
                onError?.(error);
            },
        });
    }

    createSection(
        payload: { classId: string; name: string; code?: string | null; capacity?: number | null; },
        callbacks?: { onSuccess?: () => void; onError?: (error: ApiErrorShape) => void; onComplete?: () => void }
    ): void {
        this.api.createSection(payload.classId, {
            name: payload.name,
            code: payload.code,
            capacity: payload.capacity,
        }).subscribe({
            next: () => {
                this.loadSectionsForSelectedClass();
                callbacks?.onSuccess?.();
            },
            error: (error: ApiErrorShape) => {
                this.sectionsError.set(error);
                callbacks?.onError?.(error);
                callbacks?.onComplete?.();
            },
            complete: () => callbacks?.onComplete?.(),
        });
    }

    updateSection(
        sectionId: string,
        patch: { name?: string; code?: string | null; capacity?: number | null; status?: 'active' | 'archived'; },
        callbacks?: { onSuccess?: () => void; onError?: (error: ApiErrorShape) => void; onComplete?: () => void }
    ): void {
        this.api.updateSection(sectionId, patch).subscribe({
            next: () => {
                this.loadSectionsForSelectedClass();
                callbacks?.onSuccess?.();
            },
            error: (error: ApiErrorShape) => {
                this.sectionsError.set(error);
                callbacks?.onError?.(error);
                callbacks?.onComplete?.();
            },
            complete: () => callbacks?.onComplete?.(),
        });
    }

    archiveSection(sectionId: string, confirmationText?: string, onSuccess?: () => void, onError?: (error: ApiErrorShape) => void): void {
        this.api.archiveSection(sectionId, confirmationText).subscribe({
            next: () => {
                this.loadSectionsForSelectedClass();
                onSuccess?.();
            },
            error: (error: ApiErrorShape) => {
                this.sectionsError.set(error);
                onError?.(error);
            },
        });
    }

    restoreSection(sectionId: string): void {
        this.api.restoreSection(sectionId).subscribe({
            next: () => this.loadSectionsForSelectedClass(),
            error: (error: ApiErrorShape) => this.sectionsError.set(error),
        });
    }
}
