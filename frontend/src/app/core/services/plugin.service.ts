import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type PluginStatus = 'installed' | 'enabled' | 'disabled' | 'error';

export interface PluginMenuItem {
    label: string;
    icon: string;
    route: string;
    parent?: string;
    order?: number;
}

export interface PluginSettingField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'password';
    required?: boolean;
    defaultValue?: any;
    options?: Array<{ label: string; value: any }>;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
}

export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    permissions: string[];
    provides?: {
        menuItems?: PluginMenuItem[];
        routes?: Array<{ path: string; method: string; permissions?: string[] }>;
        dashboardWidgets?: Array<{ id: string; title: string; component: string }>;
        settings?: PluginSettingField[];
    };
}

export interface Plugin {
    id: string;
    pluginId: string;
    name: string;
    version: string;
    description: string;
    author: string;
    category: string;
    status: PluginStatus | string;
    isOfficial: boolean;
    iconUrl: string;
    bannerUrl: string;
    screenshots: string[];
    price: number;
    downloads: number;
    rating: number;
    ratingCount: number;
    tags: string[];
    manifest: PluginManifest | null;
    changelog: any[];
    createdAt: Date;
    updatedAt: Date;
    isInstalled?: boolean;
    installedVersion?: string;
    installedStatus?: PluginStatus | string;
}

export interface InstalledPlugin {
    id: string;
    tenantId: string;
    pluginId: string;
    version: string;
    status: PluginStatus | string;
    settings: Record<string, any>;
    permissions: string[];
    installedAt: Date;
    enabledAt?: Date;
    disabledAt?: Date;
    lastError?: string;
    updatedAt: Date;
    manifest?: PluginManifest;
}

@Injectable({
    providedIn: 'root',
})
export class PluginService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/plugins`;

    getMarketplace(category?: string, search?: string): Observable<Plugin[]> {
        let url = `${this.apiUrl}/marketplace`;
        const params: string[] = [];

        if (category) params.push(`category=${category}`);
        if (search) params.push(`search=${search}`);

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        return this.http.get<Plugin[]>(url);
    }

    getInstalledPlugins(): Observable<InstalledPlugin[]> {
        return this.http.get<InstalledPlugin[]>(`${this.apiUrl}/installed`);
    }

    installPlugin(pluginId: string): Observable<InstalledPlugin> {
        return this.http.post<InstalledPlugin>(`${this.apiUrl}/install`, { pluginId });
    }

    enablePlugin(pluginId: string): Observable<InstalledPlugin> {
        return this.http.post<InstalledPlugin>(`${this.apiUrl}/${pluginId}/enable`, {});
    }

    disablePlugin(pluginId: string): Observable<InstalledPlugin> {
        return this.http.post<InstalledPlugin>(`${this.apiUrl}/${pluginId}/disable`, {});
    }

    uninstallPlugin(pluginId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${pluginId}`);
    }

    getPluginSettings(pluginId: string): Observable<Record<string, any>> {
        return this.http.get<Record<string, any>>(`${this.apiUrl}/${pluginId}/settings`);
    }

    updatePluginSettings(pluginId: string, settings: Record<string, any>): Observable<InstalledPlugin> {
        return this.http.put<InstalledPlugin>(`${this.apiUrl}/${pluginId}/settings`, { settings });
    }
}
