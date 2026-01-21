import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiClient, ApiError } from '../http/api-client.service';

export type AcademicLevelStatus = 'active' | 'archived';

export type AcademicLevelUsage = {
    classesCount: number;
    studentsCount?: number;
};

export type AcademicLevel = {
    id: string;
    name: string;
    code?: string;
    group?: string;
    sortOrder: number;
    status: AcademicLevelStatus;
    usage?: AcademicLevelUsage;
    updatedAt?: string;
};

export type AcademicLevelTemplateKey = 'k12' | 'primary_secondary' | 'custom';

export type AcademicLevelTemplateOption = {
    key: AcademicLevelTemplateKey;
    title: string;
    description: string;
    supportsGrouping: boolean;
    groupLabel?: string;
};

export type AcademicLevelImpact = {
    classesCount?: number;
    studentsCount?: number;
};

export type CreateAcademicLevelRequest = {
    name: string;
    code?: string;
    group?: string;
    sortOrder?: number;
};

export type UpdateAcademicLevelRequest = Partial<CreateAcademicLevelRequest> & {
    status?: AcademicLevelStatus;
};

export type ReorderAcademicLevelsRequest = {
    items: Array<{ id: string; sortOrder: number }>;
};

export type ApiEnvelope<T> = {
    data: T;
    meta?: {
        total?: number;
        page?: number;
        pageSize?: number;
        templateKey?: AcademicLevelTemplateKey;
    };
    error?: any;
};

@Injectable({ providedIn: 'root' })
export class AcademicLevelsApiService {
    private readonly api = inject(ApiClient);

    private static readonly TEMPLATE_OPTIONS: AcademicLevelTemplateOption[] = [
        {
            key: 'k12',
            title: 'K–12',
            description: 'Kindergarten through Grade 12.',
            supportsGrouping: false,
        },
        {
            key: 'primary_secondary',
            title: 'Primary / Secondary',
            description: 'Split the structure into primary and secondary segments.',
            supportsGrouping: true,
            groupLabel: 'Segment',
        },
        {
            key: 'custom',
            title: 'Custom',
            description: 'Design your own collection of levels.',
            supportsGrouping: true,
            groupLabel: 'Group',
        }
    ];

    getTemplateOptions(): AcademicLevelTemplateOption[] {
        return AcademicLevelsApiService.TEMPLATE_OPTIONS;
    }

    getLevels(): Observable<ApiEnvelope<AcademicLevel[]>> {
        return this.api.get<ApiEnvelope<AcademicLevel[]>>('academic-levels')
            .pipe(catchError(err => this.handleError(err)));
    }

    applyTemplate(templateKey: AcademicLevelTemplateKey): Observable<ApiEnvelope<{ levels: AcademicLevel[]; templateKey?: AcademicLevelTemplateKey }>> {
        return this.api.post<ApiEnvelope<{ levels: AcademicLevel[]; templateKey?: AcademicLevelTemplateKey }>>(
            'academic-levels/templates/apply',
            { templateKey }
        ).pipe(catchError(err => this.handleError(err)));
    }

    createLevel(payload: CreateAcademicLevelRequest): Observable<ApiEnvelope<AcademicLevel>> {
        return this.api.post<ApiEnvelope<AcademicLevel>>('academic-levels', payload)
            .pipe(catchError(err => this.handleError(err)));
    }

    updateLevel(levelId: string, patch: UpdateAcademicLevelRequest): Observable<ApiEnvelope<AcademicLevel>> {
        return this.api.patch<ApiEnvelope<AcademicLevel>>(`academic-levels/${levelId}`, patch)
            .pipe(catchError(err => this.handleError(err)));
    }

    reorderLevels(payload: ReorderAcademicLevelsRequest): Observable<ApiEnvelope<{ success: boolean }>> {
        return this.api.patch<ApiEnvelope<{ success: boolean }>>('academic-levels/reorder', payload)
            .pipe(catchError(err => this.handleError(err)));
    }

    archiveLevel(levelId: string, confirmationText?: string): Observable<ApiEnvelope<{ levelId: string }>> {
        return this.api.post<ApiEnvelope<{ levelId: string }>>(
            `academic-levels/${levelId}/archive`,
            confirmationText ? { confirmationText } : {}
        ).pipe(catchError(err => this.handleError(err)));
    }

    restoreLevel(levelId: string): Observable<ApiEnvelope<{ levelId: string }>> {
        return this.api.post<ApiEnvelope<{ levelId: string }>>(`academic-levels/${levelId}/restore`)
            .pipe(catchError(err => this.handleError(err)));
    }

    getDeleteImpact(levelId: string): Observable<ApiEnvelope<AcademicLevelImpact>> {
        return this.api.post<ApiEnvelope<AcademicLevelImpact>>(`academic-levels/${levelId}/impact`)
            .pipe(catchError(err => this.handleError(err)));
    }

    deleteLevel(levelId: string, confirmationText?: string): Observable<ApiEnvelope<{ levelId: string }>> {
        return this.api.delete<ApiEnvelope<{ levelId: string }>>(`academic-levels/${levelId}`, {
            params: confirmationText ? { confirmationText } : undefined
        }).pipe(catchError(err => this.handleError(err)));
    }

    private handleError(err: ApiError): Observable<never> {
        return throwError(() => err);
    }
}
