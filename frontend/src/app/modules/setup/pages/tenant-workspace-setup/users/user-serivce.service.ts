import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../../../../core/http/api-client.service';
import { ApiUser } from './user-form.mapper';

export type CreateUserPayload = {
    email: string;
    name: string;
    password: string;
    roleIds?: string[];
    schoolAccess?: { scope: 'all' | 'selected'; schoolIds?: string[] };
    profilePicture?: string | null;
    gender?: string;
    dateOfBirth?: string;
    phone?: string;
    forcePasswordReset?: boolean;
    mfaEnabled?: boolean;
    status?: 'active' | 'suspended' | 'invited';
};

export type InviteUsersPayload = {
    emails: string[];
    roleIds?: string[];
    schoolAccess?: { scope: 'all' | 'selected'; schoolIds?: string[] };
};

type ApiResponse<T> = {
    data: T;
    meta?: {
        total?: number;
        page?: number;
        pageSize?: number;
    };
};

@Injectable({ providedIn: 'root' })
export class UserSerivce {
    private readonly api = inject(ApiClient);

    getUsers(): Observable<ApiUser[]> {
        return this.api.get<ApiResponse<ApiUser[]>>('users').pipe(
            map(response => response.data ?? []),
        );
    }

    createUser(payload: CreateUserPayload): Observable<ApiUser> {
        return this.api.post<ApiResponse<ApiUser>>('users', payload).pipe(
            map(response => response.data),
        );
    }

    inviteUsers(payload: InviteUsersPayload): Observable<ApiUser[]> {
        return this.api.post<ApiResponse<ApiUser[]>>('users/invite', payload).pipe(
            map(response => response.data ?? []),
        );
    }

    updateUser(userId: string, payload: Partial<CreateUserPayload>): Observable<ApiUser> {
        return this.api.patch<ApiResponse<ApiUser>>(`users/${userId}`, payload).pipe(
            map(response => response.data),
        );
    }

    suspendUser(userId: string): Observable<ApiUser> {
        return this.api.post<ApiResponse<ApiUser>>(`users/${userId}/suspend`, {}).pipe(
            map(response => response.data),
        );
    }

    activateUser(userId: string): Observable<ApiUser> {
        return this.api.post<ApiResponse<ApiUser>>(`users/${userId}/activate`, {}).pipe(
            map(response => response.data),
        );
    }
}
