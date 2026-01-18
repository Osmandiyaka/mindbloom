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

@Injectable({ providedIn: 'root' })
export class UserSerivce {
    private readonly api = inject(ApiClient);

    getUsers(): Observable<ApiUser[]> {
        return this.api.get<ApiUser[]>('users');
    }
}
