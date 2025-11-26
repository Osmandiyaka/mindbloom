import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AdmissionApplication, ApplicationStatus } from '../models/admission.model';

@Injectable({ providedIn: 'root' })
export class AdmissionsService {
    applications = signal<AdmissionApplication[]>([]);

    constructor(private http: HttpClient) {
        this.refresh();
    }

    refresh() {
        this.http.get<any[]>(`${environment.apiUrl}/admissions`).subscribe(apps => {
            const mapped = apps.map(a => ({
                ...a,
                id: a.id || a._id,
                submittedAt: a.createdAt ? new Date(a.createdAt) : new Date(),
                updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
            }));
            this.applications.set(mapped);
        });
    }

    createApplication(input: Omit<AdmissionApplication, 'id' | 'submittedAt' | 'updatedAt' | 'status'>) {
        return this.http.post<AdmissionApplication>(`${environment.apiUrl}/admissions`, input).subscribe(() => this.refresh());
    }

    updateStatus(id: string, status: ApplicationStatus) {
        return this.http.patch(`${environment.apiUrl}/admissions/${id}/status`, { status }).subscribe(() => this.refresh());
    }
}
