import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Permission, Role } from '../models/role.model';
import { ApiClient } from '../http/api-client.service';

export interface User {
    id: string;
    email: string;
    name: string;
    roleId: string | null;
    role: { id: string; name: string } | null;
    permissions: Permission[];
    profilePicture: string | null;
    createdAt: Date;
    forcePasswordReset?: boolean;
    mfaEnabled?: boolean;
}

export interface CreateUserDto {
    email: string;
    name: string;
    password: string;
    roleId?: string;
    profilePicture?: string;
    forcePasswordReset?: boolean;
    mfaEnabled?: boolean;
}

export interface UpdateUserDto {
    email?: string;
    name?: string;
    roleId?: string | null;
    profilePicture?: string;
    forcePasswordReset?: boolean;
    mfaEnabled?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly api = inject(ApiClient);
    private readonly basePath = 'users';

    getUsers(): Observable<User[]> {
        return this.api.get<User[]>(this.basePath);
    }

    getUser(id: string): Observable<User> {
        return this.api.get<User>(`${this.basePath}/${id}`);
    }

    createUser(dto: CreateUserDto): Observable<User> {
        return this.api.post<User>(this.basePath, dto);
    }

    updateUser(id: string, dto: UpdateUserDto): Observable<User> {
        return this.api.patch<User>(`${this.basePath}/${id}`, dto);
    }

    addPermissionsToUser(userId: string, permissionIds: string[]): Observable<User> {
        return this.api.post<User>(`${this.basePath}/${userId}/permissions`, {
            permissionIds
        });
    }

    deleteUser(id: string): Observable<void> {
        return this.api.delete<void>(`${this.basePath}/${id}`);
    }
}
