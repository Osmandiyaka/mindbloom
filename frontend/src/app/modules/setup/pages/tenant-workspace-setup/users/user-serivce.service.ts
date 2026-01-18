import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../../../core/http/api-client.service';

export type ApiUser = {
    id: string;
    email: string;
    name: string;
    role?: { name: string } | null;
    profilePicture?: string | null;
    phone?: string | null;
    createdAt?: string | Date;
};

export type CreateUserPayload = {
    email: string;
    name: string;
    password: string;
    roleId?: string;
    profilePicture?: string;
    gender?: string;
    dateOfBirth?: string | Date;
    phone?: string;
    forcePasswordReset?: boolean;
    mfaEnabled?: boolean;
};

@Injectable({ providedIn: 'root' })
export class UserSerivce {
    private readonly api = inject(ApiClient);

    getUsers(): Observable<ApiUser[]> {
        return this.api.get<ApiUser[]>('users');
    }

    createUser(payload: CreateUserPayload): Observable<ApiUser> {
        return this.api.post<ApiUser>('users', payload);
    }
}
