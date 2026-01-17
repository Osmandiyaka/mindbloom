import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../http/api-client.service';

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
    private api = inject(ApiClient);
    private basePath = 'invitations';
    private httpOptions = { withCredentials: true };

    list(): Observable<Invitation[]> {
        return this.api.get<Invitation[]>(this.basePath, this.httpOptions);
    }

    create(email: string, roles: string[], expiresAt?: string): Observable<Invitation> {
        return this.api.post<Invitation>(this.basePath, { email, roles, expiresAt }, this.httpOptions);
    }

    resend(id: string): Observable<Invitation> {
        return this.api.post<Invitation>(`${this.basePath}/${id}/resend`, {}, this.httpOptions);
    }

    revoke(id: string): Observable<Invitation> {
        return this.api.delete<Invitation>(`${this.basePath}/${id}`, this.httpOptions);
    }
}
