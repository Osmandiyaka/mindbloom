import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TenantService, Tenant } from './tenant.service';

interface User {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    role: string;
}

interface AuthResponse {
    user: User;
    access_token: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_URL = environment.apiUrl;
    private readonly TOKEN_KEY = 'access_token';
    private readonly REFRESH_TOKEN_KEY = 'refresh_token';

    private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    public currentUser$ = this.currentUserSubject.asObservable();

    // Signal for login overlay visibility
    public showLoginOverlay = signal(!this.isAuthenticated());

    constructor(
        private http: HttpClient,
        private router: Router,
        private tenantService: TenantService
    ) { }

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, { email, password })
            .pipe(
                tap(response => this.handleAuthSuccess(response))
            );
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
        // Don't clear tenant - keep it persisted for next login
        this.showLoginOverlay.set(true);
        this.router.navigate(['/login']);
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    private handleAuthSuccess(response: AuthResponse): void {
        localStorage.setItem(this.TOKEN_KEY, response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        this.showLoginOverlay.set(false);

        // Fetch and set tenant information
        if (response.user.tenantId) {
            this.tenantService.getTenantById(response.user.tenantId).subscribe({
                next: (tenant) => {
                    this.tenantService.setTenant(tenant);
                },
                error: (error) => {
                    console.error('Failed to load tenant information', error);
                }
            });
        }
    }

    private getUserFromStorage(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
}
