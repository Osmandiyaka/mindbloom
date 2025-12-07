import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TenantService } from '../../../core/services/tenant.service';

export interface CreateApplicationDto {
    // Personal Information
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string; // ISO date
    gender: 'Male' | 'Female' | 'Other';
    nationality?: string;
    religion?: string;
    bloodGroup?: string;
    email: string;
    phone: string;
    
    // Address
    address: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
    };
    
    // Guardian Information
    guardians: Array<{
        name: string;
        relationship: string;
        phone: string;
        email?: string;
        occupation?: string;
        address?: string;
        isEmergencyContact?: boolean;
        isPrimaryContact?: boolean;
    }>;
    
    // Academic Information
    gradeApplying: string;
    academicYear: string;
    previousSchool?: {
        schoolName?: string;
        grade?: string;
        yearAttended?: string;
    };
    
    // Documents (URLs from upload service)
    documents?: Array<{
        name: string;
        type: string;
        url: string;
    }>;
    
    notes?: string;
}

export interface Application {
    id: string;
    tenantId: string;
    applicationNumber: string;
    status: 'inquiry' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'waitlisted' | 'enrolled' | 'withdrawn';
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date;
    gender: string;
    nationality?: string;
    religion?: string;
    bloodGroup?: string;
    email: string;
    phone: string;
    address: any;
    guardians: any[];
    gradeApplying: string;
    academicYear: string;
    previousSchool?: any;
    documents?: any[];
    notes?: string;
    statusHistory: Array<{
        status: string;
        changedBy: string;
        changedAt: Date;
        comment?: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

export interface ApplicationFilters {
    status?: string;
    gradeApplying?: string;
    academicYear?: string;
    search?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdmissionsApiService {
    private http = inject(HttpClient);
    private tenantService = inject(TenantService);
    private baseUrl = `${environment.apiUrl}/admissions`;

    /**
     * Create a new application (PUBLIC - No authentication required)
     * Requires tenant ID from current tenant context
     */
    createApplication(dto: CreateApplicationDto): Observable<Application> {
        const tenantId = this.tenantService.getTenantId();
        const params = new HttpParams().set('tenantId', tenantId || '');
        return this.http.post<Application>(this.baseUrl, dto, { params });
    }

    /**
     * Get application by application number (PUBLIC)
     * Requires tenant ID from current tenant context
     */
    getApplicationByNumber(applicationNumber: string): Observable<Application> {
        const tenantId = this.tenantService.getTenantId();
        const params = new HttpParams().set('tenantId', tenantId || '');
        return this.http.get<Application>(`${this.baseUrl}/public/${applicationNumber}`, { params });
    }

    /**
     * Get all applications with filters (ADMIN)
     */
    getApplications(filters?: ApplicationFilters): Observable<Application[]> {
        let params = new HttpParams();
        if (filters?.status) params = params.set('status', filters.status);
        if (filters?.gradeApplying) params = params.set('gradeApplying', filters.gradeApplying);
        if (filters?.academicYear) params = params.set('academicYear', filters.academicYear);
        if (filters?.search) params = params.set('search', filters.search);
        
        return this.http.get<Application[]>(this.baseUrl, { params });
    }

    /**
     * Get application by ID (ADMIN)
     */
    getApplicationById(id: string): Observable<Application> {
        return this.http.get<Application>(`${this.baseUrl}/${id}`);
    }

    /**
     * Get pipeline view (grouped by status) (ADMIN)
     */
    getPipeline(): Observable<Record<string, { count: number; applications: Application[] }>> {
        return this.http.get<Record<string, { count: number; applications: Application[] }>>(
            `${this.baseUrl}/pipeline`
        );
    }

    /**
     * Update application status (ADMIN)
     */
    updateStatus(
        id: string,
        status: string,
        comment?: string
    ): Observable<Application> {
        return this.http.patch<Application>(`${this.baseUrl}/${id}/status`, {
            status,
            comment
        });
    }

    /**
     * Accept application (shortcut) (ADMIN)
     */
    acceptApplication(id: string, comment?: string): Observable<Application> {
        return this.http.post<Application>(`${this.baseUrl}/${id}/accept`, { comment });
    }

    /**
     * Reject application (shortcut) (ADMIN)
     */
    rejectApplication(id: string, comment?: string): Observable<Application> {
        return this.http.post<Application>(`${this.baseUrl}/${id}/reject`, { comment });
    }

    /**
     * Enroll student from application (ADMIN)
     */
    enrollStudent(id: string): Observable<{ admission: Application; student: any }> {
        return this.http.post<{ admission: Application; student: any }>(
            `${this.baseUrl}/${id}/enroll`,
            {}
        );
    }

    /**
     * Delete application (ADMIN)
     */
    deleteApplication(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
