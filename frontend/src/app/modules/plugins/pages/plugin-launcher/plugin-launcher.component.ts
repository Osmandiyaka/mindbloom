import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PluginService, InstalledPlugin } from '../../../../core/services/plugin.service';

@Component({
    selector: 'app-plugin-launcher',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="plugin-launcher-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="eyebrow">Extensions</div>
          <h1>My Plugins</h1>
          <p>Launch and manage your installed plugins.</p>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>Loading your plugins...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="error-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>Failed to load plugins</h3>
        <p>{{ error() }}</p>
        <button (click)="loadPlugins()" class="btn-retry">Try Again</button>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && !error() && plugins().length === 0" class="empty-state">
        <div class="empty-icon">🔌</div>
        <h2>No Plugins Installed</h2>
        <p>You haven't installed any plugins yet. Visit the marketplace to discover and install plugins.</p>
        <button (click)="goToMarketplace()" class="btn-primary">
          Browse Marketplace
        </button>
      </div>

      <!-- Enabled Plugin Grid -->
      <div *ngIf="!loading() && !error() && enabledPlugins().length > 0" class="plugins-grid">
        <div
          *ngFor="let plugin of enabledPlugins()"
          class="plugin-card"
          (click)="launchPlugin(plugin)">
          <div class="plugin-icon">{{ getPluginIcon(plugin) }}</div>
          <div class="plugin-info">
            <h3>{{ getPluginName(plugin) }}</h3>
            <p>{{ getPluginDescription(plugin) }}</p>
          </div>
          <div class="plugin-actions">
            <button class="btn-launch">
              Launch
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Disabled Plugins Section -->
      <div *ngIf="!loading() && !error() && disabledPlugins().length > 0" class="disabled-section">
        <h2>Disabled Plugins</h2>
        <p>These plugins are installed but not currently enabled</p>
        
        <div class="disabled-plugins-list">
          <div
            *ngFor="let plugin of disabledPlugins()"
            class="disabled-plugin-card">
            <div class="left">
              <div class="plugin-icon-small">{{ getPluginIcon(plugin) }}</div>
              <div class="plugin-info-small">
                <h4>{{ getPluginName(plugin) }}</h4>
                <span class="plugin-status">Disabled</span>
              </div>
            </div>
            <button (click)="enablePlugin(plugin.pluginId); $event.stopPropagation()" class="btn-enable">
              Enable
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .plugin-launcher-container { max-width: 1400px; margin: 0 auto; padding: 1rem 0; }
    .page-header { margin-bottom: 1.5rem; }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-tertiary); font-size: 12px; margin-bottom: 4px; }
    .header-content h1 { font-size: 2.3rem; font-weight: 800; color: var(--color-text-primary); margin: 0; }
    .header-content p { font-size: 1rem; color: var(--color-text-secondary); margin: 6px 0 0 0; }

    /* Loading State */
    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; gap: 1.5rem; }
    .spinner { width: 48px; height: 48px; border: 4px solid rgba(99, 102, 241, 0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-state p { color: var(--color-text-secondary); font-size: 1.125rem; }

    /* Error State */
    .error-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; gap: 1rem; text-align: center; }
    .error-state svg { color: #ef4444; }
    .error-state h3 { font-size: 1.5rem; font-weight: 700; color: var(--color-text-primary); margin: 0; }
    .error-state p { color: var(--color-text-secondary); margin: 0; }
    .btn-retry { margin-top: 1rem; padding: 0.75rem 2rem; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 10px 20px rgba(99,102,241,0.25); }
    .btn-retry:hover { transform: translateY(-2px); box-shadow: 0 14px 24px rgba(99,102,241,0.3); }

    /* Empty State */
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; gap: 1.5rem; text-align: center; background: var(--color-surface); border: 1px dashed var(--color-border); border-radius: 16px; }
    .empty-icon { font-size: 5rem; opacity: 0.3; }
    .empty-state h2 { font-size: 1.875rem; font-weight: 700; color: var(--color-text-primary); margin: 0; }
    .empty-state p { font-size: 1.125rem; color: var(--color-text-secondary); margin: 0; max-width: 500px; }
    .btn-primary { margin-top: 1rem; padding: 0.875rem 2rem; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4); }

    /* Plugin Grid */
    .plugins-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
    .plugin-card { background: linear-gradient(180deg, var(--color-surface) 0%, color-mix(in srgb, var(--color-surface) 90%, #000) 100%); border-radius: 18px; padding: 2rem; cursor: pointer; transition: all 0.25s ease; border: 1px solid var(--color-border); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18); }
    .plugin-card:hover { transform: translateY(-6px); box-shadow: 0 26px 50px rgba(0, 0, 0, 0.24), 0 0 0 1px rgba(var(--color-primary-rgb, 123,140,255), 0.1); border-color: var(--color-primary); }
    .plugin-icon { font-size: 3rem; margin-bottom: 1rem; text-align: center; width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, rgba(123,140,255,0.18), rgba(181,140,255,0.18)); display: flex; align-items: center; justify-content: center; box-shadow: inset 0 1px 0 rgba(255,255,255,0.35); }
    .plugin-info h3 { font-size: 1.25rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 0.5rem 0; }
    .plugin-info p { font-size: 0.95rem; color: var(--color-text-secondary); margin: 0; line-height: 1.5; }
    .plugin-actions { margin-top: 1.5rem; display: flex; justify-content: flex-end; }
    .btn-launch { padding: 0.625rem 1.25rem; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; box-shadow: 0 14px 26px rgba(124, 58, 237, 0.35); }
    .btn-launch:hover { transform: translateY(-1px); box-shadow: 0 18px 30px rgba(124, 58, 237, 0.4); }

    /* Disabled Plugins Section */
    .disabled-section { margin-top: 4rem; padding-top: 2rem; border-top: 2px solid var(--color-border); }
    .disabled-section h2 { font-size: 1.5rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 0.5rem 0; }
    .disabled-section > p { font-size: 1rem; color: var(--color-text-secondary); margin: 0 0 1.5rem 0; }
    .disabled-plugins-list { display: grid; gap: 1rem; }
    .disabled-plugin-card { background: color-mix(in srgb, var(--color-surface) 92%, #000); border-radius: 14px; padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; border: 1px dashed var(--color-border); transition: all 0.2s; box-shadow: var(--shadow-sm); }
    .disabled-plugin-card:hover { border-color: var(--color-border-light); box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); }
    .left { display: flex; align-items: center; gap: 0.75rem; }
    .plugin-icon-small { font-size: 2rem; width: 36px; height: 36px; border-radius: 12px; background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12)); display: inline-flex; align-items: center; justify-content: center; }
    .plugin-info-small { flex: 1; }
    .plugin-info-small h4 { font-size: 1rem; font-weight: 600; color: var(--color-text-primary); margin: 0 0 0.25rem 0; }
    .plugin-status { font-size: 0.875rem; color: var(--color-text-tertiary); background: rgba(var(--color-border-rgb,217,223,233),0.35); padding: 0.25rem 0.75rem; border-radius: 6px; }
    .btn-enable { padding: 0.5rem 1.25rem; background: rgba(var(--color-primary-rgb,99,102,241),0.1); color: var(--color-primary); border: 1px solid var(--color-primary); border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 10px 20px rgba(var(--color-primary-rgb,99,102,241),0.12); }
    .btn-enable:hover { background: rgba(var(--color-primary-rgb,99,102,241),0.16); transform: translateY(-1px); }

    @media (max-width: 768px) {
      .plugins-grid { grid-template-columns: 1fr; }
      .page-header h1 { font-size: 2rem; }
      .disabled-plugin-card { flex-direction: column; align-items: flex-start; }
      .btn-enable { width: 100%; text-align: center; }
    }
  `]
})
export class PluginLauncherComponent implements OnInit {
    plugins = signal<InstalledPlugin[]>([]);
    loading = signal(true);
    error = signal<string | null>(null);

    constructor(
        private pluginService: PluginService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadPlugins();
    }

    loadPlugins() {
        this.loading.set(true);
        this.error.set(null);

        this.pluginService.getInstalledPlugins().subscribe({
            next: (installed) => {
                this.plugins.set(installed);
                this.loading.set(false);
            },
            error: (err: any) => {
                this.error.set(err.message || 'Failed to load plugins');
                this.loading.set(false);
            }
        });
    }

    enabledPlugins(): InstalledPlugin[] {
        return this.plugins().filter(p => p.status === 'enabled');
    }

    disabledPlugins(): InstalledPlugin[] {
        return this.plugins().filter(p => p.status === 'disabled' || p.status === 'installed');
    }

    getPluginIcon(plugin: InstalledPlugin): string {
        // Try to get icon from manifest or use default
        return plugin.manifest?.provides?.menuItems?.[0]?.icon || '🔌';
    }

    getPluginName(plugin: InstalledPlugin): string {
        return plugin.manifest?.name || plugin.pluginId;
    }

    getPluginDescription(plugin: InstalledPlugin): string {
        return plugin.manifest?.description || 'No description available';
    }

    launchPlugin(plugin: InstalledPlugin) {
        // Get the first menu item route from the plugin manifest
        const firstRoute = plugin.manifest?.provides?.menuItems?.[0]?.route;

        if (firstRoute) {
            this.router.navigate([firstRoute]);
        } else {
            // Default to plugin settings if no route defined
            this.router.navigate(['/plugins', plugin.pluginId, 'settings']);
        }
    } enablePlugin(pluginId: string) {
        this.pluginService.enablePlugin(pluginId).subscribe({
            next: () => {
                this.loadPlugins();
            },
            error: (err: any) => {
                this.error.set(err.message || 'Failed to enable plugin');
            }
        });
    }

    goToMarketplace() {
        this.router.navigate(['/setup/marketplace']);
    }
}
