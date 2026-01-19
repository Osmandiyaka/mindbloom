import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiClient, ApiError } from '../http/api-client.service';

export type ApiEnvelope<T> = { data: T; meta?: { total?: number; page?: number; pageSize?: number }; error?: any };

export type ApiErrorShape = {
    code?: string;
    message?: string;
    details?: any;
};

export type GradeDto = {
    id: string;
    tenantId: string;
    schoolIds: string[];
    name: string;
    code?: string | null;
    sortOrder?: number;
    status: 'active' | 'archived';
    createdAt?: string;
    updatedAt?: string;
};

export type ClassDto = {
    id: string;
    tenantId: string;
    schoolIds: string[];
    academicYearId?: string | null;
    gradeId?: string | null;
    name: string;
    code?: string | null;
    status: 'active' | 'archived';
    sortOrder?: number;
    sectionsCount?: number;
    createdAt?: string;
    updatedAt?: string;
};

export type SectionDto = {
    id: string;
    tenantId: string;
    classId: string;
    schoolId: string;
    academicYearId?: string | null;
    name: string;
    code?: string | null;
    capacity?: number | null;
    status: 'active' | 'archived';
    sortOrder?: number;
    createdAt?: string;
    updatedAt?: string;
};

export type ClassConfigDto = {
    tenantId: string;
    classesScope: 'perAcademicYear' | 'global';
    requireGradeLink: boolean;
    sectionUniquenessScope: 'perClass' | 'perClassPerSchool';
    updatedAt?: string;
    updatedBy?: string | null;
};

export type ListGradesParams = {
    schoolId?: string;
    status?: 'active' | 'archived';
    search?: string;
    page?: number;
    pageSize?: number;
};

export type ListClassesParams = {
    schoolId?: string;
    academicYearId?: string;
    gradeId?: string;
    status?: 'active' | 'archived';
    search?: string;
    page?: number;
    pageSize?: number;
    includeCounts?: boolean;
};

export type ListSectionsParams = {
    schoolId?: string;
    status?: 'active' | 'archived';
    search?: string;
    page?: number;
    pageSize?: number;
};

export type CreateGradeRequest = {
    name: string;
    code?: string | null;
    schoolIds: string[];
    sortOrder?: number;
};

export type UpdateGradeRequest = {
    name?: string;
    code?: string | null;
    schoolIds?: string[];
    sortOrder?: number;
    status?: 'active' | 'archived';
};

export type CreateClassRequest = {
    name: string;
    code?: string | null;
    schoolIds: string[];
    academicYearId?: string | null;
    gradeId?: string | null;
    sortOrder?: number;
};

export type UpdateClassRequest = {
    name?: string;
    code?: string | null;
    schoolIds?: string[];
    academicYearId?: string | null;
    gradeId?: string | null;
    sortOrder?: number;
    status?: 'active' | 'archived';
};

export type ReorderClassesRequest = {
    updates: Array<{ id: string; sortOrder: number }>;
};

export type CreateSectionRequest = {
    name: string;
    schoolId: string;
    code?: string | null;
    capacity?: number | null;
    sortOrder?: number;
};

export type UpdateSectionRequest = {
    name?: string;
    schoolId?: string;
    code?: string | null;
    capacity?: number | null;
    sortOrder?: number;
    status?: 'active' | 'archived';
};

export type ArchiveImpactResponse = {
    sectionsCount?: number;
    classesCount?: number;
};

@Injectable({ providedIn: 'root' })
export class AcademicsApiService {
    private readonly api = inject(ApiClient);

    listGrades(params?: ListGradesParams): Observable<ApiEnvelope<GradeDto[]>> {
        return this.api.get<ApiEnvelope<GradeDto[]>>('grades', { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    getGrade(gradeId: string): Observable<ApiEnvelope<GradeDto>> {
        return this.api.get<ApiEnvelope<GradeDto>>(`grades/${gradeId}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    createGrade(payload: CreateGradeRequest): Observable<ApiEnvelope<GradeDto>> {
        return this.api.post<ApiEnvelope<GradeDto>>('grades', payload)
            .pipe(catchError(err => this.handleError(err)));
    }

    updateGrade(gradeId: string, patch: UpdateGradeRequest): Observable<ApiEnvelope<GradeDto>> {
        return this.api.patch<ApiEnvelope<GradeDto>>(`grades/${gradeId}`, patch)
            .pipe(catchError(err => this.handleError(err)));
    }

    getGradeArchiveImpact(gradeId: string): Observable<ApiEnvelope<ArchiveImpactResponse>> {
        return this.api.post<ApiEnvelope<ArchiveImpactResponse>>(`grades/${gradeId}/archive/impact`)
            .pipe(catchError(err => this.handleError(err)));
    }

    archiveGrade(gradeId: string, confirmationText?: string): Observable<ApiEnvelope<ArchiveImpactResponse>> {
        return this.api.post<ApiEnvelope<ArchiveImpactResponse>>(`grades/${gradeId}/archive`,
            confirmationText ? { confirmationText } : {})
            .pipe(catchError(err => this.handleError(err)));
    }

    restoreGrade(gradeId: string): Observable<ApiEnvelope<{ gradeId: string }>> {
        return this.api.post<ApiEnvelope<{ gradeId: string }>>(`grades/${gradeId}/restore`)
            .pipe(catchError(err => this.handleError(err)));
    }

    listClasses(params?: ListClassesParams): Observable<ApiEnvelope<ClassDto[]>> {
        return this.api.get<ApiEnvelope<ClassDto[]>>('classes', { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    getClass(classId: string): Observable<ApiEnvelope<ClassDto>> {
        return this.api.get<ApiEnvelope<ClassDto>>(`classes/${classId}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    createClass(payload: CreateClassRequest): Observable<ApiEnvelope<ClassDto>> {
        return this.api.post<ApiEnvelope<ClassDto>>('classes', payload)
            .pipe(catchError(err => this.handleError(err)));
    }

    updateClass(classId: string, patch: UpdateClassRequest): Observable<ApiEnvelope<ClassDto>> {
        return this.api.patch<ApiEnvelope<ClassDto>>(`classes/${classId}`, patch)
            .pipe(catchError(err => this.handleError(err)));
    }

    getClassArchiveImpact(classId: string): Observable<ApiEnvelope<ArchiveImpactResponse>> {
        return this.api.post<ApiEnvelope<ArchiveImpactResponse>>(`classes/${classId}/archive/impact`)
            .pipe(catchError(err => this.handleError(err)));
    }

    archiveClass(classId: string, confirmationText?: string): Observable<ApiEnvelope<ArchiveImpactResponse>> {
        return this.api.post<ApiEnvelope<ArchiveImpactResponse>>(`classes/${classId}/archive`,
            confirmationText ? { confirmationText } : {})
            .pipe(catchError(err => this.handleError(err)));
    }

    restoreClass(classId: string): Observable<ApiEnvelope<{ classId: string }>> {
        return this.api.post<ApiEnvelope<{ classId: string }>>(`classes/${classId}/restore`)
            .pipe(catchError(err => this.handleError(err)));
    }

    reorderClasses(payload: ReorderClassesRequest): Observable<ApiEnvelope<{ success: boolean }>> {
        return this.api.patch<ApiEnvelope<{ success: boolean }>>('classes/reorder', payload)
            .pipe(catchError(err => this.handleError(err)));
    }

    listSectionsByClass(classId: string, params?: ListSectionsParams): Observable<ApiEnvelope<SectionDto[]>> {
        return this.api.get<ApiEnvelope<SectionDto[]>>(`classes/${classId}/sections`, { params })
            .pipe(catchError(err => this.handleError(err)));
    }

    getSection(sectionId: string): Observable<ApiEnvelope<SectionDto>> {
        return this.api.get<ApiEnvelope<SectionDto>>(`sections/${sectionId}`)
            .pipe(catchError(err => this.handleError(err)));
    }

    createSection(classId: string, payload: CreateSectionRequest): Observable<ApiEnvelope<SectionDto>> {
        return this.api.post<ApiEnvelope<SectionDto>>(`classes/${classId}/sections`, payload)
            .pipe(catchError(err => this.handleError(err)));
    }

    updateSection(sectionId: string, patch: UpdateSectionRequest): Observable<ApiEnvelope<SectionDto>> {
        return this.api.patch<ApiEnvelope<SectionDto>>(`sections/${sectionId}`, patch)
            .pipe(catchError(err => this.handleError(err)));
    }

    getSectionArchiveImpact(sectionId: string): Observable<ApiEnvelope<ArchiveImpactResponse>> {
        return this.api.post<ApiEnvelope<ArchiveImpactResponse>>(`sections/${sectionId}/archive/impact`)
            .pipe(catchError(err => this.handleError(err)));
    }

    archiveSection(sectionId: string, confirmationText?: string): Observable<ApiEnvelope<{ sectionId: string }>> {
        return this.api.post<ApiEnvelope<{ sectionId: string }>>(`sections/${sectionId}/archive`,
            confirmationText ? { confirmationText } : {})
            .pipe(catchError(err => this.handleError(err)));
    }

    restoreSection(sectionId: string): Observable<ApiEnvelope<{ sectionId: string }>> {
        return this.api.post<ApiEnvelope<{ sectionId: string }>>(`sections/${sectionId}/restore`)
            .pipe(catchError(err => this.handleError(err)));
    }

    getClassConfig(): Observable<ApiEnvelope<ClassConfigDto>> {
        return this.api.get<ApiEnvelope<ClassConfigDto>>('classConfig')
            .pipe(catchError(err => this.handleError(err)));
    }

    updateClassConfig(patch: Partial<ClassConfigDto>): Observable<ApiEnvelope<ClassConfigDto>> {
        return this.api.patch<ApiEnvelope<ClassConfigDto>>('classConfig', patch)
            .pipe(catchError(err => this.handleError(err)));
    }

    private handleError(err: ApiError | ApiErrorShape): Observable<never> {
        const normalized: ApiErrorShape = {
            code: (err as ApiErrorShape).code ?? (err as any)?.error?.code,
            message: (err as ApiErrorShape).message ?? (err as any)?.message,
            details: (err as any)?.error?.details ?? (err as ApiErrorShape).details,
        };
        return throwError(() => normalized);
    }
}
