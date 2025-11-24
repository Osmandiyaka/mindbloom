import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Plugin {
  id: string;
  pluginId: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  status: string;
  isOfficial: boolean;
  iconUrl: string;
  bannerUrl: string;
  screenshots: string[];
  price: number;
  downloads: number;
  rating: number;
  ratingCount: number;
  tags: string[];
  manifest: any;
  changelog: any[];
  createdAt: Date;
  updatedAt: Date;
  isInstalled?: boolean;
  installedVersion?: string;
  installedStatus?: string;
}

export interface InstalledPlugin {
  id: string;
  tenantId: string;
  pluginId: string;
  version: string;
  status: string;
  settings: Record<string, any>;
  permissions: string[];
  installedAt: Date;
  enabledAt?: Date;
  disabledAt?: Date;
  lastError?: string;
  updatedAt: Date;
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
}
