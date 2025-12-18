import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map, finalize, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthSession, AuthTokens } from './auth.models';
import { AuthStorage } from './auth.storage';

interface RefreshTokenRequest {
    refreshToken: string;
}

interface RefreshTokenResponse {
    accessToken: string;
    refreshToken?: string;
    expiresAt: string;
}

interface LoginRequest {
    email: string;
    password: string;
}

interface LoginResponse {
    user: {
        id: string;
        email: string;
        fullName?: string;
        avatarUrl?: string;
    };
    memberships: {
        tenantId: string;
        tenantSlug: string;
        tenantName: string;
        roles: string[];
        permissions?: string[];
    }[];
    activeTenantId?: string;
    tokens: {
        accessToken: string;
        refreshToken?: string;
        tokenType?: 'Bearer';
    };
    expiresAt: string;
    issuedAt?: string;
}

// Legacy API login shape (access_token + user)
interface LegacyLoginResponse {
    access_token: string;
    user: {
        id: string;
        tenantId?: string;
        email: string;
        name?: string;
        roleId?: string;
        role?: any;
    };
}

// Legacy User type for compatibility
export interface User {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    role?: any; // Optional for legacy compatibility
}

// Legacy AuthResponse for compatibility
export interface AuthResponse {
    user: User;
    access_token: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);
    private readonly API_URL = environment.apiUrl;

    // Signals
    session = signal<AuthSession | null>(null);
    status = signal<'unresolved' | 'authenticated' | 'anonymous'>('unresolved');

    // Derived computed signals
    isAuthenticated = computed(() => this.status() === 'authenticated');
    accessToken = computed(() => this.session()?.tokens?.accessToken ?? null);

    // Prevent concurrent refresh calls
    private refreshInFlight: Promise<boolean> | null = null;

    // Fallback expiry for tokens that do not provide exp
    private readonly defaultTtlMs = 10 * 60 * 1000; // 10 minutes

    constructor() {
        // Initialize on service creation (can also be called explicitly from app)
        this.init().catch((err) => console.error('[AuthService] Init error:', err));
    }

    /**
     * Bootstrap session on app load:
     * 1. Set status to 'unresolved'
     * 2. Try to restore from storage
     * 3. If valid and not expired, set authenticated
     * 4. If expired, try refresh; else anonymous
     */
    async init(): Promise<void> {
        this.status.set('unresolved');

        const stored = AuthStorage.read();
        if (!stored) {
            this.status.set('anonymous');
            return;
        }

        // Check if token is expired with 60s skew
        const skew = 60000; // 60 seconds in ms
        const expiresAt = new Date(stored.expiresAt).getTime();
        const now = Date.now();

        if (now < expiresAt - skew) {
            // Token is still valid
            this.session.set(stored);
            this.status.set('authenticated');
            return;
        }

        // Token expired; try refresh if refreshToken exists
        if (stored.tokens.refreshToken) {
            const refreshed = await this.refresh();
            if (refreshed) {
                return; // Status already set in refresh()
            }
        }

        // Refresh failed or no refreshToken; go anonymous
        this.session.set(null);
        this.status.set('anonymous');
    }

    /**
     * Set session directly (e.g., after login).
     * Writes to storage and updates signals.
     */
    setSession(session: AuthSession): void {
        this.session.set(session);
        this.status.set('authenticated');
        AuthStorage.write(session);
    }

    /**
     * Clear session from memory and storage.
     * Emits 'anonymous' status.
     * Call tenant service clear if available (placeholder for future).
     */
    clearSession(): void {
        this.session.set(null);
        this.status.set('anonymous');
        AuthStorage.clear();
        // TODO: Emit event or call tenantService?.clear() if available
    }

    /**
     * Logout: clear session and redirect to login.
     * Optionally sends logout signal to backend.
     */
    logout(reason?: string): void {
        // Try to signal backend (best effort)
        this.http
            .post(`${this.API_URL}/auth/logout`, {}, { withCredentials: true })
            .pipe(catchError(() => throwError(() => new Error('Logout failed'))))
            .subscribe({
                next: () => console.log('[AuthService] Backend logout OK'),
                error: (err) => console.warn('[AuthService] Backend logout error:', err),
                complete: () => {
                    this.clearSession();
                    this.router.navigate(['/login'], {
                        queryParams: reason ? { reason } : {},
                    });
                },
            });

        // Also clear locally immediately
        this.clearSession();
        this.router.navigate(['/login']);
    }

    /**
     * Get access token (for templates or interceptor).
     */
    getAccessToken(): string | null {
        return this.accessToken();
    }

    /**
     * Refresh access token using refresh token.
     * Serializes concurrent calls (single-flight).
     * Returns true if successful, false if failed.
     */
    async refresh(): Promise<boolean> {
        // Serialize: if refresh is already in flight, wait for it
        if (this.refreshInFlight) {
            return this.refreshInFlight;
        }

        const current = this.session();
        if (!current?.tokens?.refreshToken) {
            // No refresh token available
            this.clearSession();
            return false;
        }

        // Mark refresh as in flight
        const promise = new Promise<boolean>((resolve) => {
            const payload: RefreshTokenRequest = {
                refreshToken: current.tokens.refreshToken!,
            };

            this.http
                .post<RefreshTokenResponse>(
                    `${this.API_URL}/auth/refresh`,
                    payload,
                    { withCredentials: true }
                )
                .pipe(
                    tap((response) => {
                        // Update tokens and expiresAt
                        const updated: AuthSession = {
                            ...current,
                            tokens: {
                                ...current.tokens,
                                accessToken: response.accessToken,
                                refreshToken: response.refreshToken ?? current.tokens.refreshToken,
                            },
                            expiresAt: response.expiresAt,
                        };
                        this.setSession(updated);
                        resolve(true);
                    }),
                    catchError((error) => {
                        console.error('[AuthService] Refresh failed:', error);
                        this.clearSession();
                        resolve(false);
                        return throwError(() => error);
                    })
                )
                .subscribe({
                    error: () => {
                        this.refreshInFlight = null;
                    },
                    complete: () => {
                        this.refreshInFlight = null;
                    },
                });
        });

        this.refreshInFlight = promise;
        return promise;
    }

    /**
     * Utility: check if a token string is expired (with optional skew).
     */
    isTokenExpired(
        expiresAt: string,
        skewMs: number = 60000
    ): boolean {
        const expTime = new Date(expiresAt).getTime();
        return Date.now() >= expTime - skewMs;
    }

    // ============================================================================
    // Legacy compatibility methods (for backward compatibility)
    // ============================================================================

    /**
     * Legacy: BehaviorSubject for currentUser$ observable.
     */
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    /**
     * Legacy: login method returning Observable<AuthResponse>.
     * Handles both new and legacy backend shapes.
     */
    login(email: string, password: string): Observable<AuthResponse> {
        return this.http
            .post<LoginResponse | LegacyLoginResponse>(`${this.API_URL}/auth/login`, { email, password }, {
                withCredentials: true,
            })
            .pipe(
                tap((response) => {
                    const normalized = this.normalizeLoginResponse(response);
                    this.setSession(normalized.session);
                    this.currentUserSubject.next(normalized.legacyUser);
                }),
                map((response) => {
                    const normalized = this.normalizeLoginResponse(response);
                    return {
                        user: normalized.legacyUser,
                        access_token: normalized.session.tokens.accessToken,
                    };
                })
            );
    }

    /**
     * Legacy: getCurrentUser method for old code.
     */
    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    /**
     * Legacy: requestPasswordReset for forgot password flow.
     */
    requestPasswordReset(identifier: string): Observable<any> {
        return this.http.post(`${this.API_URL}/auth/forgot-password`, { identifier });
    }

    /**
     * Legacy: resetPassword for reset password flow.
     */
    resetPassword(token: string, password: string): Observable<any> {
        return this.http.post(`${this.API_URL}/auth/reset-password`, { token, password });
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Normalize login response (new or legacy) into AuthSession + legacy user.
     */
    private normalizeLoginResponse(response: LoginResponse | LegacyLoginResponse): {
        session: AuthSession;
        legacyUser: User;
    } {
        const isLegacy = (response as LegacyLoginResponse).access_token !== undefined;

        // Extract tokens
        const accessToken = isLegacy
            ? (response as LegacyLoginResponse).access_token
            : (response as LoginResponse).tokens.accessToken;

        const refreshToken = !isLegacy
            ? (response as LoginResponse).tokens.refreshToken
            : undefined;

        // Extract user
        const user = isLegacy
            ? (response as LegacyLoginResponse).user
            : (response as LoginResponse).user;

        // Derive expiresAt from token exp if not provided
        const expiresAt = isLegacy
            ? this.deriveExpiryFromToken(accessToken)
            : (response as LoginResponse).expiresAt;

        const legacyUser: User = {
            id: user.id,
            email: user.email,
            name: (user as any).fullName || (user as any).name || user.email,
            tenantId: (user as any).tenantId || (response as any).activeTenantId || '',
            role: (user as any).role,
        };

        const memberships = !isLegacy
            ? (response as LoginResponse).memberships
            : [{
                tenantId: legacyUser.tenantId || '',
                tenantSlug: legacyUser.tenantId || '',
                tenantName: (user as any).tenantName || 'Tenant',
                roles: [(user as any).role?.name || 'User'],
                permissions: (user as any).role?.permissions?.map((p: any) => p.displayName) || [],
            }];

        const session: AuthSession = {
            user: {
                id: user.id,
                email: user.email,
                fullName: (user as any).fullName || (user as any).name,
                avatarUrl: (user as any).avatarUrl,
            },
            memberships,
            activeTenantId: (response as any).activeTenantId || legacyUser.tenantId,
            tokens: {
                accessToken,
                refreshToken,
                tokenType: 'Bearer',
            },
            expiresAt,
            issuedAt: this.deriveIssuedAtFromToken(accessToken),
        };

        return { session, legacyUser };
    }

    /**
     * Derive expiry from JWT `exp` or fall back to default TTL.
     */
    private deriveExpiryFromToken(token: string): string {
        try {
            const payload = JSON.parse(atob(token.split('.')[1] || ''));
            const expSeconds = typeof payload.exp === 'number' ? payload.exp : undefined;
            const expMs = expSeconds ? expSeconds * 1000 : Date.now() + this.defaultTtlMs;
            return new Date(expMs).toISOString();
        } catch {
            return new Date(Date.now() + this.defaultTtlMs).toISOString();
        }
    }

    /**
     * Derive issued-at from JWT `iat` if available.
     */
    private deriveIssuedAtFromToken(token: string): string | undefined {
        try {
            const payload = JSON.parse(atob(token.split('.')[1] || ''));
            if (typeof payload.iat === 'number') {
                return new Date(payload.iat * 1000).toISOString();
            }
        } catch {
            // ignore
        }
        return undefined;
    }
}
