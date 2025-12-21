import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject, of, firstValueFrom } from 'rxjs';
import { tap, catchError, map, finalize, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthSession, AuthTokens } from './auth.models';
import { AuthStorage } from './auth.storage';
import { RbacService } from '../rbac/rbac.service';
import { RoleDefinition } from '../rbac/permissions.types';
import { TenantService } from '../services/tenant.service';
import { EditionFeaturesService, EditionSnapshot } from '../../shared/services/edition-features.service';

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
    tenantId?: string;
}

interface LoginResponse {
    user: {
        id: string;
        tenantId?: string | null;
        email: string;
        fullName?: string;
        avatarUrl?: string;
        role?: any;
        roleId?: string | null;
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
    isHost?: boolean;
}

// Legacy API login shape (access_token + user)
interface LegacyLoginResponse {
    access_token: string;
    tenantSlug?: string | null;
    user: {
        id: string;
        tenantId?: string | null;
        email: string;
        name?: string;
        roleId?: string;
        role?: any;
    };
    isHost?: boolean;
}

interface CurrentLoginInfoResponse {
    user: {
        id: string;
        tenantId: string;
        email: string;
        name: string;
        roleId: string | null;
        role?: any;
        permissions?: string[];
    };
    tenant: {
        id: string;
        name: string;
        subdomain: string;
        status: string;
        plan: string;
        locale?: string;
        timezone?: string;
        enabledModules?: string[];
        contactInfo?: { email: string };
    };
    edition: EditionSnapshot;
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
    private readonly rbacService = inject(RbacService);
    // Use bare HttpClient (no interceptors) to avoid DI circularity with auth/tenant interceptors
    private readonly http = new HttpClient(inject(HttpBackend));
    private readonly tenantService = inject(TenantService);
    private readonly editionFeatures = inject(EditionFeaturesService);
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

    // Ensure RBAC roles load once per session
    private rbacLoadPromise: Promise<void> | null = null;

    private readonly allActions = ['create', 'read', 'update', 'delete', 'export', 'import', 'approve', 'manage', 'mark', 'issue', 'return', 'process', 'publish', 'edit', 'view', 'write', 'assign', 'allocate', 'impersonate', 'system', 'record', 'refund', 'cancel'];

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
            // Re-initialize RBAC from restored session
            this.rbacLoadPromise = this.loadRbacForSession(stored);
            await this.rbacLoadPromise;
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
     * Also initializes RBAC permissions.
     */
    setSession(session: AuthSession): void {
        this.session.set(session);
        this.status.set('authenticated');
        AuthStorage.write(session);

        // Initialize RBAC with user session and role definitions
        this.rbacLoadPromise = this.loadRbacForSession(session);
        void this.rbacLoadPromise;
    }

    /**
     * Clear session from memory and storage.
     * Emits 'anonymous' status.
     * Also clears RBAC state.
     */
    clearSession(): void {
        this.session.set(null);
        this.status.set('anonymous');
        AuthStorage.clear();
        this.rbacService.clear();
        this.rbacLoadPromise = null;
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
     * Get current session (synchronous accessor)
     */
    getSession(): AuthSession | null {
        return this.session();
    }

    /**
     * Get active membership (prefers activeTenantId then first membership)
     */
    getActiveMembership(): AuthSession['memberships'][number] | undefined {
        const current = this.session();
        return this.getActiveMembershipFromSession(current as AuthSession);
    }

    /**
     * Wait for RBAC roles to finish loading (used by guards/directives)
     */
    ensureRbacLoaded(): Promise<void> {
        return this.rbacLoadPromise ?? Promise.resolve();
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
    login(email: string, password: string, tenantId?: string | null): Observable<AuthResponse> {
        const payload: any = { email, password };
        // Only include tenantId when it's a non-empty string to avoid sending `null` which triggers backend validation
        if (typeof tenantId === 'string' && tenantId.trim().length > 0) {
            payload.tenantId = tenantId.trim();
        }

        return this.http
            .post<LoginResponse | LegacyLoginResponse>(`${this.API_URL}/auth/login`, payload, {
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
     * Apply a login-like response (used for impersonation flows) to the current session.
     */
    applyLoginResponse(response: LoginResponse | LegacyLoginResponse) {
        const normalized = this.normalizeLoginResponse(response);
        this.setSession(normalized.session);
        this.currentUserSubject.next(normalized.legacyUser);
        return normalized.session;
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
        const roleName = (response as any)?.user?.role?.name || (response as any)?.roleName;

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
            tenantId: (user as any).tenantId ?? (response as any).activeTenantId ?? null,
            role: (user as any).role,
        };

        const isHost = (response as any).isHost === true
            || roleName === 'Host Admin'
            || (!legacyUser.tenantId && !((response as any).activeTenantId));

        const hostPermissions = this.flattenPermissions(((user as any)?.role?.permissions as any[]) || []);

        const memberships = !isLegacy
            ? ((isHost ? [] : (response as LoginResponse).memberships))
            : (isHost ? [] : [{
                tenantId: legacyUser.tenantId || '',
                tenantSlug: (response as LegacyLoginResponse).tenantSlug || legacyUser.tenantId || '',
                tenantName: (user as any).tenantName || 'Tenant',
                roles: [(user as any).role?.name || 'User'],
                permissions: (user as any).role?.permissions?.map((p: any) => p.displayName) || [],
            }]);

        const session: AuthSession = {
            user: {
                id: user.id,
                email: user.email,
                fullName: (user as any).fullName || (user as any).name,
                avatarUrl: (user as any).avatarUrl,
            },
            memberships,
            activeTenantId: isHost ? undefined : ((response as any).activeTenantId || legacyUser.tenantId || undefined),
            tokens: {
                accessToken,
                refreshToken,
                tokenType: 'Bearer',
            },
            expiresAt,
            issuedAt: this.deriveIssuedAtFromToken(accessToken),
            mode: isHost ? 'host' : 'tenant',
            hostContext: isHost ? {
                roleName: roleName || 'Host Admin',
                permissions: hostPermissions,
            } : undefined,
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

    private async loadRbacForSession(session: AuthSession): Promise<void> {
        if (this.isHostSession(session)) {
            const permissions = session.hostContext?.permissions?.length
                ? session.hostContext.permissions.map((p) => this.normalizePermissionKey(p))
                : ['*', '*.*'];

            const roleName = session.hostContext?.roleName || 'Host Admin';

            this.rbacService.setSession({
                userId: session.user.id,
                tenantId: 'host',
                roleIds: [roleName],
                permissionOverrides: { allow: permissions },
            });

            this.rbacService.setRoles([
                {
                    id: roleName,
                    name: roleName,
                    description: 'Platform host access',
                    permissions,
                    isSystem: true,
                },
            ]);
            return;
        }

        const membership = this.getActiveMembershipFromSession(session);

        if (!membership) {
            console.warn('[AuthService] No tenant membership found, RBAC not initialized');
            this.rbacService.clear();
            return;
        }

        const loginInfo = await this.fetchCurrentLoginInfo(membership.tenantId, session.tokens.accessToken);

        if (loginInfo) {
            if (loginInfo.tenant) {
                try {
                    this.tenantService.setTenant({
                        ...loginInfo.tenant,
                        enabledModules: loginInfo.tenant.enabledModules || [],
                    } as any);
                } catch (error) {
                    console.warn('[AuthService] Failed to cache tenant from login-info', error);
                }
            }

            if (loginInfo.edition) {
                this.editionFeatures.setEdition(loginInfo.edition);
            }

            const inlinePermissions = (loginInfo.user.permissions || [])
                .map((p: string) => this.normalizePermissionKey(p));

            const rbacSession = {
                userId: loginInfo.user.id,
                tenantId: loginInfo.user.tenantId,
                roleIds: this.roleIdsFromLoginInfo(loginInfo),
                permissionOverrides: inlinePermissions.length
                    ? { allow: inlinePermissions }
                    : undefined,
            };

            this.rbacService.setSession(rbacSession);

            const roles: RoleDefinition[] = [];

            if (loginInfo.user.role) {
                roles.push(this.mapRoleFromApi(loginInfo.user.role));
            }

            this.rbacService.setRoles(roles);
            return;
        }

        // Ensure tenant details (plan, enabledModules) are loaded from backend to drive entitlements
        await this.ensureTenantLoaded(membership.tenantId);

        // Load edition/features for current tenant (backend-driven)
        const edition = await this.fetchEditionForTenant(membership.tenantId, session.tokens.accessToken);
        if (edition) {
            this.editionFeatures.setEdition(edition);
        }

        const rbacSession = {
            userId: session.user.id,
            tenantId: membership.tenantId,
            roleIds: membership.roles || []
        };

        this.rbacService.setSession(rbacSession);

        const roles: RoleDefinition[] = [];

        // Inline permissions from membership (if provided by backend)
        if (membership.permissions?.length) {
            roles.push({
                id: 'membership-inline',
                name: 'Membership Permissions',
                description: 'Permissions provided by membership',
                permissions: membership.permissions.map((p) => this.normalizePermissionKey(p)),
                isSystem: true,
            });
        }

        // Fetch role definitions from backend
        try {
            const apiRoles = await this.fetchRolesForTenant(membership.tenantId);
            roles.push(...apiRoles);
        } catch (error) {
            console.error('[AuthService] Failed to load roles from API', error);
        }

        this.rbacService.setRoles(roles);
    }

    private getActiveMembershipFromSession(session?: AuthSession): AuthSession['memberships'][number] | undefined {
        if (!session?.memberships?.length) return undefined;
        if (session.activeTenantId) {
            const match = session.memberships.find((m) => m.tenantId === session.activeTenantId);
            if (match) return match;
        }
        return session.memberships[0];
    }

    private normalizePermissionKey(permission: string): string {
        return permission
            .replace(/:/g, '.')
            .replace(/\s+/g, '')
            .toLowerCase();
    }

    private roleIdsFromLoginInfo(info: CurrentLoginInfoResponse): string[] {
        const roleIds: string[] = [];
        if (info.user.roleId) {
            roleIds.push(info.user.roleId);
        }
        if (info.user.role?.name) {
            roleIds.push(info.user.role.name);
        }
        return roleIds;
    }

    private mapRoleFromApi(role: any): RoleDefinition {
        const permissions = this.flattenPermissions(role.permissions || []);

        return {
            id: role.id || role._id || role.name,
            name: role.name,
            description: role.description,
            permissions,
            isSystem: role.isSystemRole || role.isSystem,
        };
    }

    private flattenPermissions(permissions: any[]): string[] {
        const set = new Set<string>();

        for (const perm of permissions) {
            // Global wildcard grants everything
            if (perm === '*' || (typeof perm === 'object' && perm?.permission === '*')) {
                set.add('*');
                set.add('*.*');
                continue;
            }

            // Support string permission keys: "students.read"
            if (typeof perm === 'string') {
                if (perm.trim() === '*') {
                    set.add('*');
                    set.add('*.*');
                    continue;
                }
                set.add(this.normalizePermissionKey(perm));
                continue;
            }

            const resource = perm.resource || perm.name || perm.id;
            const actions = perm.actions || perm.action || perm.verbs;

            // If permission already carries a fully qualified key
            if (!resource && perm.permission) {
                set.add(this.normalizePermissionKey(perm.permission));
                continue;
            }

            if (!resource || !actions) continue;

            const actionList = Array.isArray(actions) ? actions : [actions];

            for (const action of actionList) {
                if (action === '*') {
                    set.add(this.normalizePermissionKey(`${resource}.*`));
                    set.add(this.normalizePermissionKey(`${resource}.manage`));
                    continue;
                }
                if (action === 'manage') {
                    // Grant all known actions for this resource
                    for (const a of this.allActions) {
                        set.add(this.normalizePermissionKey(`${resource}.${a}`));
                    }
                    set.add(this.normalizePermissionKey(`${resource}.*`));
                } else {
                    set.add(this.normalizePermissionKey(`${resource}.${action}`));
                }
            }
        }

        return Array.from(set);
    }

    private async fetchRolesForTenant(tenantId: string): Promise<RoleDefinition[]> {
        const response = await firstValueFrom(
            this.http.get<any>(`${this.API_URL}/roles`, {
                withCredentials: true,
                headers: {
                    'x-tenant-id': tenantId,
                },
            }),
        );

        const rolesArray = Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
                ? response.data
                : [];

        if (!rolesArray.length) {
            console.warn('[AuthService] /roles returned no roles for tenant', tenantId, 'raw response:', response);
            return [];
        }

        return rolesArray.map((role: any) => this.mapRoleFromApi(role));
    }

    private async fetchCurrentLoginInfo(tenantId: string, accessToken: string | undefined): Promise<CurrentLoginInfoResponse | null> {
        if (!accessToken) return null;

        try {
            const response = await firstValueFrom(
                this.http.get<CurrentLoginInfoResponse>(`${this.API_URL}/auth/login-info`, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'x-tenant-id': tenantId,
                    },
                }),
            );
            return response;
        } catch (error) {
            console.warn('[AuthService] Failed to fetch current login info', { tenantId, error });
            return null;
        }
    }

    private async ensureTenantLoaded(tenantId: string): Promise<void> {
        try {
            const current = this.tenantService.getCurrentTenantValue?.();
            if (current?.id === tenantId) {
                return;
            }

            const tenant = await firstValueFrom(this.tenantService.getTenantById(tenantId));
            if (tenant) {
                this.tenantService.setTenant(tenant);
                console.debug('[AuthService] Tenant loaded for RBAC', {
                    tenantId: tenant.id,
                    edition: tenant.edition ?? tenant.plan,
                    enabledModules: tenant.enabledModules,
                });
            }
        } catch (error) {
            console.warn('[AuthService] Failed to load tenant for RBAC', { tenantId, error });
        }
    }

    private async fetchEditionForTenant(tenantId: string, accessToken: string | undefined): Promise<EditionSnapshot | null> {
        try {
            if (!accessToken) return null;
            const dto = await firstValueFrom(
                this.http.get<EditionSnapshot>(`${this.API_URL}/tenants/current/edition`, {
                    withCredentials: true,
                    headers: {
                        'x-tenant-id': tenantId,
                        Authorization: `Bearer ${accessToken}`,
                    },
                }),
            );
            return dto;
        } catch (error) {
            console.warn('[AuthService] Failed to load edition/features', { tenantId, error });
            return null;
        }
    }

    private isHostSession(session?: AuthSession | null): boolean {
        if (!session) return false;
        if (session.mode === 'host') return true;
        return (session.hostContext !== undefined) && (!session.memberships || session.memberships.length === 0);
    }
}
