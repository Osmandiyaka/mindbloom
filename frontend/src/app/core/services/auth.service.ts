import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of, catchError, map, finalize, shareReplay } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TenantService } from './tenant.service';
import { Role } from '../models/role.model';

export interface User {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    roleId: string | null;
    role: Role | null;
}

export interface AuthResponse {
    user: User;
    access_token: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_URL = environment.apiUrl;
    private readonly TOKEN_KEY = 'access_token';
    private accessToken: string | null = null;
    private refreshInFlight$?: Observable<string | null>;
    private hasAttemptedRefresh = false;

    private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    public currentUser$ = this.currentUserSubject.asObservable();

    // Signal for login overlay visibility
    public showLoginOverlay = signal(!this.isAuthenticated());

    constructor(
        private http: HttpClient,
        private router: Router,
        private tenantService: TenantService
    ) {
        this.loadTokenFromStorage();
        this.tryRestoreSession();
    }

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, { email, password }, { withCredentials: true })
            .pipe(tap(response => this.handleAuthSuccess(response)));
    }

    logout(): void {
        this.http.post(`${this.API_URL}/auth/logout`, {}, { withCredentials: true })
            .pipe(catchError(() => of(null)))
            .subscribe();
        this.handleSessionEnd('logout');
    }

    isAuthenticated(): boolean {
        if (!this.accessToken) {
            this.loadTokenFromStorage();
        }
        return !!this.accessToken;
    }

    getToken(): string | null {
        if (!this.accessToken) {
            this.loadTokenFromStorage();
        }
        return this.accessToken;
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    ensureAuthenticated(): Observable<boolean> {
        if (this.isAuthenticated()) {
            return of(true);
        }
        if (this.hasAttemptedRefresh) {
            return of(false);
        }
        return this.refreshAccessToken().pipe(
            map(token => !!token),
            catchError(() => of(false))
        );
    }

    handleSessionEnd(reason: 'logout' | 'expired' = 'logout'): void {
        this.accessToken = null;
        this.hasAttemptedRefresh = true;
        this.refreshInFlight$ = undefined;
        localStorage.removeItem('user');
        localStorage.removeItem(this.TOKEN_KEY);
        this.currentUserSubject.next(null);
        this.showLoginOverlay.set(true);

        if (reason === 'expired') {
            this.router.navigate(['/login'], { queryParams: { sessionExpired: 'true' } });
        } else {
            this.router.navigate(['/login']);
        }
    }

    private handleAuthSuccess(response: AuthResponse): void {
        this.accessToken = response.access_token;
        if (this.accessToken) {
            localStorage.setItem(this.TOKEN_KEY, this.accessToken);
        }
        this.persistUser(response.user);
        this.currentUserSubject.next(response.user);
        this.showLoginOverlay.set(false);

        if (response.user.tenantId) {
            this.tenantService.getTenantById(response.user.tenantId).subscribe({
                next: (tenant) => this.tenantService.setTenant(tenant),
                error: (error) => console.error('Failed to load tenant information', error)
            });
        }
    }

    refreshAccessToken(): Observable<string | null> {
        if (this.refreshInFlight$) {
            return this.refreshInFlight$;
        }

        this.refreshInFlight$ = this.http.post<AuthResponse>(`${this.API_URL}/auth/refresh`, {}, { withCredentials: true })
            .pipe(
                tap((response) => this.handleAuthSuccess(response)),
                map(response => response.access_token || null),
                finalize(() => {
                    this.refreshInFlight$ = undefined;
                    this.hasAttemptedRefresh = true;
                }),
                shareReplay(1),
            );

        return this.refreshInFlight$;
    }

    private tryRestoreSession(): void {
        this.refreshAccessToken().pipe(catchError(() => of(null))).subscribe();
    }

    private loadTokenFromStorage() {
        const persistedToken = localStorage.getItem(this.TOKEN_KEY);
        if (persistedToken) {
            this.accessToken = persistedToken;
        }
    }

    private getUserFromStorage(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    private persistUser(user: User): void {
        localStorage.setItem('user', JSON.stringify(user));
    }

    /* Forgot / Reset Password */
    requestPasswordReset(identifier: string) {
        return this.http.post(`${this.API_URL}/auth/forgot-password`, { identifier });
    }

    resetPassword(token: string, password: string) {
        return this.http.post(`${this.API_URL}/auth/reset-password`, { token, password });
    }
}
