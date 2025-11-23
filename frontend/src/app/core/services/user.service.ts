import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permission } from '../models/role.model';

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: Permission[];
    createdAt: Date;
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

    addPermissionsToUser(userId: string, permissionIds: string[]): Observable<User> {
        return this.http.post<User>(`${this.apiUrl}/${userId}/permissions`, {
            permissionIds
        });
    }
}
