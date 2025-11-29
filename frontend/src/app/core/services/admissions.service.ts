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

    getApplication(id: string): AdmissionApplication | undefined {
        return this.applications().find(a => a.id === id);
    }

    getApplicationDetail(id: string): {
        parentName: string;
        parentContact: string;
        parentEmail?: string;
        documents: { name: string; type: string; url?: string }[];
    } | undefined {
        const app = this.getApplication(id);
        if (!app) return undefined;
        const docs = app.documents?.length
            ? app.documents
            : [
                { name: 'Birth Certificate', type: 'PDF' },
                { name: 'Report Card', type: 'PDF' },
                { name: 'ID Photo', type: 'Image' },
            ];
        return {
            parentName: `Parent of ${app.applicantName}`,
            parentContact: app.phone || '+2348000000000',
            parentEmail: app.email,
            documents: docs,
        };
    }

    private rebuildPipelineFromApps(apps: AdmissionApplication[]) {
        const labels: Record<ApplicationStatus, string> = {
            review: 'In Review',
            rejected: 'Rejected',
            enrolled: 'Enrolled',
        };
        const grouped = Object.keys(labels).map(status => {
            const cast = status as ApplicationStatus;
            const items = apps.filter(a => a.status === cast);
            return { status: cast, label: labels[cast], applications: items, count: items.length };
        });
        this.pipelineStages.set(grouped);
    }

    private setApplications(apps: AdmissionApplication[]) {
        this.applications.set(apps);
        this.rebuildPipelineFromApps(apps);
    }

    setApplicationStatusLocal(id: string, status: ApplicationStatus, note?: string) {
        const next = this.applications().map(a => a.id === id ? { ...a, status, updatedAt: new Date(), notes: note ?? a.notes } : a);
        this.setApplications(next);
    }

    private mockPipeline() {
        const mockApps: AdmissionApplication[] = [
            { id: 'mock-1', applicantName: 'Amaka Obi', gradeApplying: 'Grade 6', email: 'amaka@school.com', phone: '+2348011111111', status: 'review', submittedAt: new Date(), updatedAt: new Date(), documents: [{ name: 'Birth Certificate', type: 'PDF' }, { name: 'Report Card', type: 'PDF' }] },
            { id: 'mock-2', applicantName: 'Chidi Okeke', gradeApplying: 'Grade 5', email: 'chidi@school.com', phone: '+2348022222222', status: 'review', submittedAt: new Date(), updatedAt: new Date(), documents: [{ name: 'Transfer Certificate', type: 'PDF' }] },
            { id: 'mock-3', applicantName: 'Sara Danjuma', gradeApplying: 'Grade 7', email: 'sara@school.com', phone: '+2348033333333', status: 'enrolled', submittedAt: new Date(), updatedAt: new Date(), documents: [{ name: 'ID Photo', type: 'Image' }] },
        ];
        this.setApplications(mockApps);
    }

    private mockInvoices() {
        this.recentInvoices.set([
            { id: 'INV-1001', studentName: 'Amaka Obi', status: 'due', amount: 250 },
            { id: 'INV-1000', studentName: 'Chidi Okeke', status: 'paid', amount: 180 },
            { id: 'INV-0999', studentName: 'Sara Danjuma', status: 'overdue', amount: 320 },
        ]);
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
                    if (!normalized.length) {
                        // keep UI testable when API is empty
                        this.mockPipeline();
                    } else {
                        this.pipelineStages.set(normalized);
                        this.applications.set(normalized.flatMap(s => s.applications));
                        if (!this.applications().length) {
                            this.mockPipeline();
                        }
                    }
                    this.error.set(null);
                }),
                catchError(err => {
                    this.error.set(err?.error?.message || 'Unable to load admissions pipeline');
                    // Keep UI testable even without backend
                    this.mockPipeline();
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
                    this.mockInvoices();
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
                    // optimistic local fallback
                    this.setApplicationStatusLocal(id, status, note);
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
