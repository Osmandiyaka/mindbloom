import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, finalize, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdmissionApplication, ApplicationStatus } from '../models/admission.model';

@Injectable({ providedIn: 'root' })
export class AdmissionsService {
    applications = signal<AdmissionApplication[]>([]);
    pipelineStages = signal<{ status: ApplicationStatus; label: string; applications: AdmissionApplication[]; count: number; }[]>([]);
    recentInvoices = signal<any[]>([]);
    loading = signal<boolean>(false);
    error = signal<string | null>(null);
    private actionState = signal<Record<string, boolean>>({});

    constructor(private http: HttpClient) {
        this.refresh();
    }

    refresh() {
        this.loadPipeline();
        this.loadRecentInvoices();
    }

    private tenantParams() {
        let params = new HttpParams();
        if (environment.tenantId) params = params.set('tenantId', environment.tenantId);
        return params;
    }

    private normalizeApps(apps: any[]): AdmissionApplication[] {
        return (apps || []).map(a => ({
            ...a,
            id: a.id || a._id,
            submittedAt: a.createdAt ? new Date(a.createdAt) : new Date(),
            updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
        }));
    }

    loadPipeline() {
        this.loading.set(true);
        this.http.get<{ stages: any[] }>(`${environment.apiUrl}/admissions/pipeline`, { params: this.tenantParams() })
            .pipe(
                tap(res => {
                    const stages = res?.stages || [];
                    const normalized = stages.map(stage => ({
                        status: stage.status as ApplicationStatus,
                        label: stage.label,
                        count: stage.count,
                        applications: this.normalizeApps(stage.applications),
                    }));
                    this.pipelineStages.set(normalized);
                    this.applications.set(normalized.flatMap(s => s.applications));
                    this.error.set(null);
                }),
                catchError(err => {
                    this.error.set(err?.error?.message || 'Unable to load admissions pipeline');
                    return of(null);
                }),
                finalize(() => this.loading.set(false)),
            )
            .subscribe();
    }

    loadRecentInvoices() {
        this.http.get<any[]>(`${environment.apiUrl}/admissions/recent-invoices`, { params: this.tenantParams() })
            .pipe(
                tap(list => this.recentInvoices.set(list || [])),
                catchError(err => {
                    this.error.set(err?.error?.message || 'Unable to load recent invoices');
                    return of([]);
                }),
            )
            .subscribe();
    }

    createApplication(input: Omit<AdmissionApplication, 'id' | 'submittedAt' | 'updatedAt' | 'status'>) {
        this.loading.set(true);
        return this.http.post<AdmissionApplication>(`${environment.apiUrl}/admissions`, { ...input, tenantId: environment.tenantId })
            .pipe(
                tap(() => this.refresh()),
                catchError(err => {
                    this.error.set(err?.error?.message || 'Unable to submit application');
                    return of(null);
                }),
                finalize(() => this.loading.set(false)),
            );
    }

    updateStatus(id: string, status: ApplicationStatus, note?: string) {
        this.actionState.update(state => ({ ...state, [id]: true }));
        return this.http.patch(`${environment.apiUrl}/admissions/${id}/status`, { status, note, tenantId: environment.tenantId })
            .pipe(
                tap(() => this.refresh()),
                catchError(err => {
                    this.error.set(err?.error?.message || 'Unable to update status');
                    return of(null);
                }),
                finalize(() => this.actionState.update(state => ({ ...state, [id]: false }))),
            )
            .subscribe();
    }

    isBusy(id: string) {
        return !!this.actionState()[id];
    }
}
