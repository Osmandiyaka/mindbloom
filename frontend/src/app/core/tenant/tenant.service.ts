/**
 * Tenant resolution and context management service.
 * 
 * Single source of truth for tenant identity, resolution strategy,
 * and lifecycle management. Prevents "flash" of protected content.
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TenantContext, TenantResolutionStatus, TenantBranding } from './tenant.models';

interface TenantLookupResponse {
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    branding?: TenantBranding;
}

interface TenantResolveRequest {
    slug: string;
}

@Injectable({
    providedIn: 'root'
})
export class TenantResolverService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = environment.apiUrl;

    // Primary signals
    tenant = signal<TenantContext | null>(null);
    status = signal<TenantResolutionStatus>('idle');

    // Derived computed signals
    isReady = computed(() => this.status() === 'ready');
    isFailed = computed(() => this.status() === 'not-found' || this.status() === 'error');

    // Resolution promise for concurrent protection
    private resolutionPromise: Promise<TenantContext | null> | null = null;

    constructor() { }

    /**
     * Resolve tenant from subdomain or route path.
     * Idempotent: returns existing tenant if already resolved.
     */
    async resolveTenant(): Promise<TenantContext | null> {
        // If already ready, return cached tenant
        if (this.status() === 'ready' && this.tenant()) {
            return this.tenant();
        }

        // If currently resolving, wait for existing promise
        if (this.resolutionPromise) {
            return this.resolutionPromise;
        }

        // Start new resolution
        this.status.set('resolving');
        this.resolutionPromise = this._performResolution();

        return this.resolutionPromise;
    }

    /**
     * Clear tenant on logout.
     */
    clearTenant(): void {
        this.tenant.set(null);
        this.status.set('idle');
        this.resolutionPromise = null;
    }

    /**
     * Internal resolution logic.
     */
    private async _performResolution(): Promise<TenantContext | null> {
        try {
            // Try subdomain first
            const subdomainTenant = await this._tryResolveBySubdomain();
            if (subdomainTenant) {
                this.tenant.set(subdomainTenant);
                this.status.set('ready');
                return subdomainTenant;
            }

            // Fall back to path-based resolution
            const pathTenant = await this._tryResolveByPath();
            if (pathTenant) {
                this.tenant.set(pathTenant);
                this.status.set('ready');
                return pathTenant;
            }

            // Fall back to JWT/auth-based resolution (after login)
            const jwtTenant = await this._tryResolveFromJWT();
            if (jwtTenant) {
                this.tenant.set(jwtTenant);
                this.status.set('ready');
                return jwtTenant;
            }

            // No resolution strategy succeeded
            this.tenant.set(null);
            this.status.set('not-found');
            return null;
        } catch (error) {
            console.error('Tenant resolution error:', error);
            this.tenant.set(null);
            this.status.set('error');
            return null;
        } finally {
            this.resolutionPromise = null;
        }
    }

    /**
     * Try to resolve tenant from hostname subdomain.
     * E.g., "st-marys.yourdomain.com" -> slug "st-marys"
     */
    private async _tryResolveBySubdomain(): Promise<TenantContext | null> {
        const hostname = window.location.hostname;

        // Skip for localhost or IPs (will fall back to path resolution)
        if (this._isLocalhost(hostname) || this._isIpAddress(hostname)) {
            return null;
        }

        // Extract subdomain (first segment before first dot)
        const segments = hostname.split('.');
        if (segments.length < 2) {
            // Single segment (invalid) or TLD only
            return null;
        }

        const potentialSlug = segments[0];

        // Skip www or common reserved subdomains
        if (['www', 'mail', 'smtp', 'api', 'admin'].includes(potentialSlug)) {
            return null;
        }

        // Look up tenant by slug
        return this._lookupTenantBySlug(potentialSlug, 'subdomain');
    }

    /**
     * Try to resolve tenant from route path.
     * Looks for first path segment matching /t/:slug or /:slug
     * Default pattern is /t/:slug (configurable via environment or route data)
     */
    private async _tryResolveByPath(): Promise<TenantContext | null> {
        const pathname = window.location.pathname;
        const segments = pathname.split('/').filter(Boolean); // ["t", "st-marys", "dashboard"] or similar

        if (segments.length === 0) {
            return null;
        }

        // Pattern 1: /t/:slug/... (recommended)
        if (segments[0] === 't' && segments.length >= 2) {
            const slug = segments[1];
            return this._lookupTenantBySlug(slug, 'path');
        }

        // Pattern 2: /:slug/... (if first segment looks like a slug)
        // Only if it doesn't match known app routes
        const knownRoutes = [
            'login', 'apply', 'auth', 'dashboard', 'students', 'academics',
            'attendance', 'fees', 'accounting', 'finance', 'hr', 'payroll',
            'library', 'hostel', 'transport', 'roles', 'tasks', 'setup', 'plugins',
            'tenant-not-found', 'error'
        ];

        if (segments[0] && !knownRoutes.includes(segments[0])) {
            const slug = segments[0];
            return this._lookupTenantBySlug(slug, 'path');
        }

        return null;
    }

    /**
     * Look up tenant record by slug from backend.
     * Stub: structured for API integration.
     */
    private async _lookupTenantBySlug(
        slug: string,
        resolvedFrom: 'subdomain' | 'path'
    ): Promise<TenantContext | null> {
        try {
            // API call to resolve slug -> tenant
            const response = await this.http
                .post<TenantLookupResponse>(
                    `${this.API_URL}/platform/tenants/resolve`,
                    { slug } as TenantResolveRequest
                )
                .toPromise();

            if (!response) {
                return null;
            }

            return {
                tenantId: response.tenantId,
                tenantSlug: response.tenantSlug,
                tenantName: response.tenantName,
                branding: response.branding,
                resolvedFrom
            };
        } catch (error) {
            console.warn(`Tenant lookup failed for slug "${slug}":`, error);
            return null;
        }
    }

    /**
     * Try to resolve tenant from JWT token (after login).
     * Extracts tenantId from token and looks up tenant details.
     */
    private async _tryResolveFromJWT(): Promise<TenantContext | null> {
        try {
            // Get the access token from localStorage
            const token = localStorage.getItem('auth_token') ||
                localStorage.getItem('access_token') ||
                sessionStorage.getItem('auth_token');

            if (!token) {
                return null;
            }

            // Decode JWT (simple client-side decode, no verification needed here)
            const decoded = this._decodeJWT(token);
            if (!decoded || !decoded.tenantId) {
                return null;
            }

            // Look up tenant by tenantId
            const response = await this.http
                .get<any>(
                    `${this.API_URL}/tenants/${decoded.tenantId}`
                )
                .toPromise();

            if (!response) {
                return null;
            }

            return {
                tenantId: response.id || decoded.tenantId,
                tenantSlug: response.subdomain,
                tenantName: response.name,
                branding: response.branding,
                resolvedFrom: 'jwt'
            };
        } catch (error) {
            console.warn('Tenant resolution from JWT failed:', error);
            return null;
        }
    }

    /**
     * Simple JWT decoder (client-side, no verification).
     */
    private _decodeJWT(token: string): any {
        try {
            const payload = token.split('.')[1];
            if (!payload) return null;
            return JSON.parse(atob(payload));
        } catch {
            return null;
        }
    }

    /**
     * Check if hostname is localhost or loopback.
     */
    private _isLocalhost(hostname: string): boolean {
        return hostname === 'localhost' || hostname.startsWith('localhost:');
    }

    /**
     * Check if hostname is an IP address.
     */
    private _isIpAddress(hostname: string): boolean {
        // Simple IPv4 check
        const ipv4Regex = /^\d+\.\d+\.\d+\.\d+/;
        return ipv4Regex.test(hostname);
    }
}
