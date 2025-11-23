import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permission, Role } from '../models/role.model';

export interface User {
    id: string;
    email: string;
    name: string;
    roleId: string | null;
    role: { id: string; name: string } | null;
    permissions: Permission[];
    createdAt: Date;
}

export interface CreateUserDto {
    email: string;
    name: string;
    password: string;
    roleId?: string;
}

export interface UpdateUserDto {
    email?: string;
    name?: string;
    roleId?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/users`;

    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(this.apiUrl);
    }

    getUser(id: string): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/${id}`);
    }

    createUser(dto: CreateUserDto): Observable<User> {
        return this.http.post<User>(this.apiUrl, dto);
    }

    updateUser(id: string, dto: UpdateUserDto): Observable<User> {
        return this.http.patch<User>(`${this.apiUrl}/${id}`, dto);
    }

    addPermissionsToUser(userId: string, permissionIds: string[]): Observable<User> {
        return this.http.post<User>(`${this.apiUrl}/${userId}/permissions`, {
            permissionIds
        });
    }
}
