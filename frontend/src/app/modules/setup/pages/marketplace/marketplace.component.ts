import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PluginService, Plugin } from '../../../../core/services/plugin.service';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="marketplace-container">
      <!-- Header -->
      <div class="page-header">
        <h1>🏪 Plugin Marketplace</h1>
        <p class="subtitle">Extend MindBloom with powerful plugins</p>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="search-box">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="onSearchChange()"
            placeholder="🔍 Search plugins..."
            class="search-input"
          />
        </div>
        <div class="category-filters">
          <button
            *ngFor="let cat of categories"
            (click)="selectCategory(cat.value)"
            [class.active]="selectedCategory() === cat.value"
            class="category-btn"
          >
            {{ cat.icon }} {{ cat.label }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>Loading plugins...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="error-state">
        <p>❌ {{ error() }}</p>
        <button (click)="loadPlugins()" class="btn-retry">Retry</button>
      </div>

      <!-- Plugin Grid -->
      <div *ngIf="!loading() && !error()" class="plugins-grid">
        <div *ngFor="let plugin of filteredPlugins()" class="plugin-card">
          <div class="plugin-header">
            <div class="plugin-icon">{{ plugin.iconUrl }}</div>
            <div class="plugin-info">
              <h3>{{ plugin.name }}</h3>
              <p class="plugin-author">by {{ plugin.author }}</p>
            </div>
            <span *ngIf="plugin.isOfficial" class="badge-official">✓ Official</span>
          </div>

          <p class="plugin-description">{{ plugin.description }}</p>

          <div class="plugin-meta">
            <div class="meta-item">
              <span class="meta-icon">⭐</span>
              <span>{{ plugin.rating }} ({{ plugin.ratingCount }})</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">⬇️</span>
              <span>{{ formatDownloads(plugin.downloads) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">📦</span>
              <span>v{{ plugin.version }}</span>
            </div>
          </div>

          <div class="plugin-tags">
            <span *ngFor="let tag of plugin.tags.slice(0, 3)" class="tag">
              {{ tag }}
            </span>
          </div>

          <div class="plugin-actions">
            <ng-container *ngIf="!plugin.isInstalled">
              <button
                (click)="installPlugin(plugin)"
                [disabled]="installing() === plugin.pluginId"
                class="btn-install"
              >
                {{ installing() === plugin.pluginId ? '⏳ Installing...' : plugin.price > 0 ? '💳 Buy $' + plugin.price : '⬇️ Install' }}
              </button>
            </ng-container>

            <ng-container *ngIf="plugin.isInstalled">
              <div class="installed-status">
                <span class="status-badge" [class]="'status-' + plugin.installedStatus">
                  {{ plugin.installedStatus === 'enabled' ? '✓ Enabled' : '⏸ Disabled' }}
                </span>
                <div class="installed-actions">
                  <button
                    *ngIf="plugin.installedStatus === 'disabled'"
                    (click)="enablePlugin(plugin)"
                    [disabled]="processing() === plugin.pluginId"
                    class="btn-enable"
                  >
                    ▶️ Enable
                  </button>
                  <button
                    *ngIf="plugin.installedStatus === 'enabled'"
                    (click)="disablePlugin(plugin)"
                    [disabled]="processing() === plugin.pluginId"
                    class="btn-disable"
                  >
                    ⏸ Disable
                  </button>
                  <button
                    (click)="uninstallPlugin(plugin)"
                    [disabled]="processing() === plugin.pluginId"
                    class="btn-uninstall"
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && !error() && filteredPlugins().length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No plugins found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    </div>
  `,
  styles: [`
    .marketplace-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .page-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .page-header h1 {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: #666;
      font-size: 1.1rem;
      margin: 0;
    }

    .filters-section {
      background: white;
      padding: 1.5rem;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      margin-bottom: 2rem;
    }

    .search-box {
      margin-bottom: 1rem;
    }

    .search-input {
      width: 100%;
      padding: 0.875rem 1.25rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.2s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .category-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .category-btn {
      padding: 0.625rem 1.25rem;
      border: 2px solid #e5e7eb;
      background: white;
      border-radius: 24px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #4b5563;
    }

    .category-btn:hover {
      border-color: #667eea;
      color: #667eea;
      transform: translateY(-1px);
    }

    .category-btn.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-color: #667eea;
      color: white;
    }

    .loading-state,
    .error-state,
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #f3f4f6;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .btn-retry {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .plugins-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .plugin-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;
      border: 2px solid transparent;
      display: flex;
      flex-direction: column;
    }

    .plugin-card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      transform: translateY(-4px);
      border-color: #667eea;
    }

    .plugin-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
      position: relative;
    }

    .plugin-icon {
      font-size: 2.5rem;
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-radius: 12px;
      flex-shrink: 0;
    }

    .plugin-info {
      flex: 1;
    }

    .plugin-info h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1f2937;
    }

    .plugin-author {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .badge-official {
      position: absolute;
      top: 0;
      right: 0;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .plugin-description {
      color: #4b5563;
      font-size: 0.875rem;
      line-height: 1.6;
      margin: 0 0 1rem 0;
      flex: 1;
    }

    .plugin-meta {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .meta-icon {
      font-size: 1rem;
    }

    .plugin-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .tag {
      background: #f3f4f6;
      color: #6b7280;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .plugin-actions {
      margin-top: auto;
    }

    .btn-install {
      width: 100%;
      padding: 0.875rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 1rem;
    }

    .btn-install:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
    }

    .btn-install:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .installed-status {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 700;
      text-align: center;
    }

    .status-badge.status-enabled {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge.status-disabled {
      background: #fef3c7;
      color: #92400e;
    }

    .installed-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-enable,
    .btn-disable,
    .btn-uninstall {
      flex: 1;
      padding: 0.625rem;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-enable {
      background: #10b981;
      color: white;
    }

    .btn-enable:hover:not(:disabled) {
      background: #059669;
    }

    .btn-disable {
      background: #f59e0b;
      color: white;
    }

    .btn-disable:hover:not(:disabled) {
      background: #d97706;
    }

    .btn-uninstall {
      background: #ef4444;
      color: white;
    }

    .btn-uninstall:hover:not(:disabled) {
      background: #dc2626;
    }

    .btn-enable:disabled,
    .btn-disable:disabled,
    .btn-uninstall:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `],
})
export class MarketplaceComponent implements OnInit {
  plugins = signal<Plugin[]>([]);
  loading = signal(true);
  error = signal('');
  selectedCategory = signal<string | undefined>(undefined);
  searchQuery = '';
  installing = signal<string | null>(null);
  processing = signal<string | null>(null);

  categories = [
    { label: 'All', value: undefined, icon: '🏪' },
    { label: 'Communication', value: 'communication', icon: '📱' },
    { label: 'Payment', value: 'payment', icon: '💳' },
    { label: 'Analytics', value: 'analytics', icon: '📊' },
    { label: 'Attendance', value: 'attendance', icon: '👆' },
    { label: 'Reporting', value: 'reporting', icon: '📄' },
    { label: 'Library', value: 'library', icon: '📚' },
  ];

  filteredPlugins = computed(() => {
    let result = this.plugins();

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return result;
  });

  constructor(private pluginService: PluginService) {}

  ngOnInit() {
    this.loadPlugins();
  }

  loadPlugins() {
    this.loading.set(true);
    this.error.set('');

    this.pluginService
      .getMarketplace(this.selectedCategory(), undefined)
      .subscribe({
        next: (plugins) => {
          this.plugins.set(plugins);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load plugins. Please try again.');
          this.loading.set(false);
          console.error('Error loading plugins:', err);
        },
      });
  }

  selectCategory(category: string | undefined) {
    this.selectedCategory.set(category);
    this.loadPlugins();
  }

  onSearchChange() {
    // Search is handled by computed signal
  }

  installPlugin(plugin: Plugin) {
    if (confirm(`Install ${plugin.name}?`)) {
      this.installing.set(plugin.pluginId);

      this.pluginService.installPlugin(plugin.pluginId).subscribe({
        next: () => {
          this.installing.set(null);
          this.loadPlugins(); // Refresh to show installed status
        },
        error: (err) => {
          this.installing.set(null);
          alert('Failed to install plugin: ' + (err.error?.message || 'Unknown error'));
          console.error('Installation error:', err);
        },
      });
    }
  }

  enablePlugin(plugin: Plugin) {
    this.processing.set(plugin.pluginId);

    this.pluginService.enablePlugin(plugin.pluginId).subscribe({
      next: () => {
        this.processing.set(null);
        this.loadPlugins();
      },
      error: (err) => {
        this.processing.set(null);
        alert('Failed to enable plugin');
        console.error('Enable error:', err);
      },
    });
  }

  disablePlugin(plugin: Plugin) {
    this.processing.set(plugin.pluginId);

    this.pluginService.disablePlugin(plugin.pluginId).subscribe({
      next: () => {
        this.processing.set(null);
        this.loadPlugins();
      },
      error: (err) => {
        this.processing.set(null);
        alert('Failed to disable plugin');
        console.error('Disable error:', err);
      },
    });
  }

  uninstallPlugin(plugin: Plugin) {
    if (confirm(`Uninstall ${plugin.name}? This action cannot be undone.`)) {
      this.processing.set(plugin.pluginId);

      this.pluginService.uninstallPlugin(plugin.pluginId).subscribe({
        next: () => {
          this.processing.set(null);
          this.loadPlugins();
        },
        error: (err) => {
          this.processing.set(null);
          alert('Failed to uninstall plugin');
          console.error('Uninstall error:', err);
        },
      });
    }
  }

  formatDownloads(count: number): string {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  }
}
