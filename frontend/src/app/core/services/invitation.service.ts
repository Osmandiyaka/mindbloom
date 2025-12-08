import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked' | 'sent';

export interface Invitation {
    id: string;
    tenantId: string;
    email: string;
    roles: string[];
    status: InvitationStatus;
    token: string;
    expiresAt: string;
    createdBy: string;
    createdAt: string;
    updatedAt?: string;
    sentAt?: string;
}

@Injectable({ providedIn: 'root' })
export class InvitationService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/invitations`;
    private httpOptions = { withCredentials: true };

    list(): Observable<Invitation[]> {
        return this.http.get<Invitation[]>(this.baseUrl, this.httpOptions);
    }

    create(email: string, roles: string[], expiresAt?: string): Observable<Invitation> {
        return this.http.post<Invitation>(this.baseUrl, { email, roles, expiresAt }, this.httpOptions);
    }

    resend(id: string): Observable<Invitation> {
        return this.http.post<Invitation>(`${this.baseUrl}/${id}/resend`, {}, this.httpOptions);
    }

    revoke(id: string): Observable<Invitation> {
        return this.http.delete<Invitation>(`${this.baseUrl}/${id}`, this.httpOptions);
    }
}
