import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PermissionsService {
    private http = inject(HttpClient);

    loadPermissions(): Observable<string[]> {
        return this.http.get<{ permissions: string[] }>('/api/permissions/me').pipe(
            map((response) => (response.permissions || []).map((permission) => this.normalize(permission))),
        );
    }

    private normalize(permission: string): string {
        return permission.replace(/:/g, '.').replace(/\s+/g, '').toLowerCase();
    }
}
