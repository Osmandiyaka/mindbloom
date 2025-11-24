import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PluginService, Plugin } from '../../../../core/services/plugin.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationDialogComponent],
  template: `
    <div class="marketplace">
      <!-- Hero Search Section -->
      <div class="hero">
        <div class="hero-content">
          <h1>Discover Extensions</h1>
          <p class="tagline">Supercharge your workflow with powerful plugins</p>
          
          <div class="search-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearchChange()"
              placeholder="Search for plugins, features, integrations..."
            />
          </div>
        </div>

        <!-- Floating Category Pills -->
        <div class="categories">
          <button
            *ngFor="let cat of categories"
            (click)="selectCategory(cat.value)"
            [class.active]="selectedCategory() === cat.value"
          >
            {{ cat.label }}
          </button>
        </div>
      </div>

      <!-- Results Summary -->
      <div *ngIf="!loading() && !error()" class="results-bar">
        <span class="results-count">{{ filteredPlugins().length }} plugins</span>
        <div class="view-toggle">
          <button [class.active]="viewMode === 'grid'" (click)="viewMode = 'grid'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button [class.active]="viewMode === 'list'" (click)="viewMode = 'list'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading">
        <div class="spinner"></div>
        <p>Loading amazing plugins...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>{{ error() }}</p>
        <button (click)="loadPlugins()">Try Again</button>
      </div>

      <!-- Premium Plugin Grid -->
      <div *ngIf="!loading() && !error()" [class]="'plugin-' + viewMode">
        <div *ngFor="let plugin of filteredPlugins()" class="plugin" (click)="viewPluginDetail(plugin)">
          <!-- Gradient Header -->
          <div class="plugin-header" [style.background]="getPluginGradient(plugin)">
            <div class="plugin-icon">{{ plugin.iconUrl }}</div>
            <div class="plugin-badge" *ngIf="plugin.isInstalled && plugin.installedStatus === 'enabled'">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>

          <!-- Content -->
          <div class="plugin-content">
            <div class="plugin-title-row">
              <h3>{{ plugin.name }}</h3>
              <span class="version">v{{ plugin.version }}</span>
            </div>
            
            <p class="author">By {{ plugin.author }}</p>
            <p class="description">{{ plugin.description }}</p>

            <!-- Stats -->
            <div class="stats">
              <div class="stat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>{{ formatDownloads(plugin.downloads) }}</span>
              </div>
              <div class="stat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span>{{ plugin.rating }}</span>
              </div>
              <div class="stat" *ngIf="plugin.price > 0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                <span>\${{ plugin.price }}</span>
              </div>
            </div>

            <!-- Action -->
            <div class="plugin-action">
              <ng-container *ngIf="!plugin.isInstalled">
                <button
                  (click)="installPlugin(plugin); $event.stopPropagation()"
                  [disabled]="installing() === plugin.pluginId"
                  class="btn-install"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>{{ installing() === plugin.pluginId ? 'Installing...' : 'Install' }}</span>
                </button>
              </ng-container>

              <ng-container *ngIf="plugin.isInstalled">
                <div class="installed-label" [class.active]="plugin.installedStatus === 'enabled'">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>{{ plugin.installedStatus === 'enabled' ? 'Active' : 'Installed' }}</span>
                </div>
              </ng-container>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && !error() && filteredPlugins().length === 0" class="empty">
        <p>No plugins found</p>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <app-confirmation-dialog
      [isOpen]="confirmDialog.isOpen"
      [title]="confirmDialog.title"
      [message]="confirmDialog.message"
      [type]="confirmDialog.type"
      [confirmText]="confirmDialog.confirmText"
      [processing]="confirmDialog.processing"
      (confirmed)="onConfirmAction()"
      (cancelled)="closeConfirmDialog()"
    />
  `,
  styles: [`
    .marketplace {
      min-height: 100vh;
      background: linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%);
    }

    /* Hero Section */
    .hero {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 4rem 2rem 3rem;
      position: relative;
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
      opacity: 0.3;
    }

    .hero-content {
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    .hero h1 {
      font-size: 3rem;
      font-weight: 800;
      color: white;
      margin: 0 0 0.75rem 0;
      letter-spacing: -0.03em;
    }

    .tagline {
      font-size: 1.25rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 2.5rem 0;
      font-weight: 400;
    }

    /* Premium Search Box */
    .search-box {
      max-width: 700px;
      position: relative;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .search-box:focus-within {
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }

    .search-box svg {
      position: absolute;
      left: 1.5rem;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
      z-index: 2;
    }

    .search-box input {
      width: 100%;
      padding: 1.25rem 1.5rem 1.25rem 3.5rem;
      border: none;
      font-size: 1.0625rem;
      outline: none;
      background: transparent;
      color: #111827;
    }

    .search-box input::placeholder {
      color: #9ca3af;
    }

    /* Floating Categories */
    .categories {
      max-width: 1200px;
      margin: 2rem auto 0;
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      position: relative;
      z-index: 1;
    }

    .categories button {
      padding: 0.75rem 1.5rem;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      color: white;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      border-radius: 12px;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .categories button:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }

    .categories button.active {
      background: white;
      color: #667eea;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    /* Results Bar */
    .results-bar {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 2rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .results-count {
      font-size: 0.9375rem;
      color: #6b7280;
      font-weight: 600;
    }

    .view-toggle {
      display: flex;
      gap: 0.5rem;
      background: white;
      padding: 0.25rem;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
    }

    .view-toggle button {
      padding: 0.5rem 0.75rem;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      color: #6b7280;
    }

    .view-toggle button:hover {
      background: #f9fafb;
    }

    .view-toggle button.active {
      background: #111827;
      color: white;
    }

    /* States */
    .loading,
    .error {
      text-align: center;
      padding: 6rem 2rem;
    }

    .loading p {
      margin-top: 1.5rem;
      color: #6b7280;
      font-size: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error svg {
      color: #ef4444;
      margin-bottom: 1rem;
    }

    .error p {
      color: #6b7280;
      margin: 1rem 0;
    }

    .error button {
      padding: 0.75rem 1.5rem;
      background: #111827;
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .error button:hover {
      background: #000;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }

    /* Plugin Grid Layout */
    .plugin-grid {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem 4rem;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .plugin-list {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 2rem 4rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Premium Plugin Card */
    .plugin {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      border: 1px solid transparent;
    }

    .plugin:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
      border-color: #e5e7eb;
    }

    /* Plugin Header with Gradient */
    .plugin-header {
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .plugin-header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: shimmer 3s infinite;
    }

    @keyframes shimmer {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(-30%, -30%); }
    }

    .plugin-icon {
      font-size: 4rem;
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
      position: relative;
      z-index: 1;
    }

    .plugin-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 28px;
      height: 28px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 2;
    }

    .plugin-badge svg {
      color: #10b981;
    }

    /* Plugin Content */
    .plugin-content {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .plugin-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .plugin-content h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: #111827;
      line-height: 1.3;
      flex: 1;
    }

    .version {
      font-size: 0.75rem;
      color: #9ca3af;
      background: #f3f4f6;
      padding: 0.25rem 0.625rem;
      border-radius: 6px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .author {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
    }

    .description {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 2.8em;
    }

    /* Stats Row */
    .stats {
      display: flex;
      gap: 1.25rem;
      padding-top: 0.5rem;
      border-top: 1px solid #f3f4f6;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .stat svg {
      color: #9ca3af;
    }

    /* Action Button */
    .plugin-action {
      padding-top: 0.75rem;
    }

    .btn-install {
      width: 100%;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-install:hover:not(:disabled) {
      background: linear-gradient(135deg, #000000 0%, #111827 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }

    .btn-install:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .installed-label {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #f3f4f6;
      color: #6b7280;
      border-radius: 10px;
      font-size: 0.9375rem;
      font-weight: 600;
    }

    .installed-label.active {
      background: #d1fae5;
      color: #059669;
    }

    .installed-label svg {
      flex-shrink: 0;
    }

    /* List View Styles */
    .plugin-list .plugin {
      display: flex;
      flex-direction: row;
    }

    .plugin-list .plugin-header {
      width: 160px;
      flex-shrink: 0;
    }

    .plugin-list .plugin-content {
      flex: 1;
      flex-direction: row;
      gap: 1.5rem;
      align-items: center;
    }

    .plugin-list .plugin-title-row {
      flex-direction: column;
      align-items: flex-start;
      flex: 1;
    }

    .plugin-list .description {
      -webkit-line-clamp: 1;
    }

    .plugin-list .plugin-action {
      padding-top: 0;
      width: 160px;
      flex-shrink: 0;
    }

    /* Empty State */
    .empty {
      text-align: center;
      padding: 6rem 2rem;
      color: #9ca3af;
      font-size: 1rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2rem;
      }

      .tagline {
        font-size: 1rem;
      }

      .plugin-grid {
        grid-template-columns: 1fr;
      }

      .plugin-list .plugin {
        flex-direction: column;
      }

      .plugin-list .plugin-header {
        width: 100%;
        height: 120px;
      }

      .plugin-list .plugin-content {
        flex-direction: column;
        align-items: stretch;
      }

      .plugin-list .plugin-action {
        width: 100%;
      }

      .results-bar {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
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
  viewMode: 'grid' | 'list' = 'grid';

  confirmDialog = {
    isOpen: false,
    title: '',
    message: '',
    type: 'warning' as 'warning' | 'danger' | 'info' | 'success',
    confirmText: 'Confirm',
    processing: false,
    action: null as (() => void) | null
  };

  categories = [
    { label: 'All', value: undefined },
    { label: 'Communication', value: 'communication' },
    { label: 'Payment', value: 'payment' },
    { label: 'Analytics', value: 'analytics' },
    { label: 'Attendance', value: 'attendance' },
    { label: 'Reporting', value: 'reporting' },
    { label: 'Library', value: 'library' },
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

  constructor(private pluginService: PluginService, private router: Router) { } ngOnInit() {
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
    this.confirmDialog = {
      isOpen: true,
      title: 'Install Plugin',
      message: `Install ${plugin.name}? ${plugin.price > 0 ? `This will charge $${plugin.price} to your account.` : 'This plugin is free.'}`,
      type: 'info',
      confirmText: plugin.price > 0 ? `Pay $${plugin.price}` : 'Install',
      processing: false,
      action: () => {
        this.confirmDialog.processing = true;
        this.installing.set(plugin.pluginId);

        this.pluginService.installPlugin(plugin.pluginId).subscribe({
          next: () => {
            this.installing.set(null);
            this.closeConfirmDialog();
            this.loadPlugins();
          },
          error: (err) => {
            this.installing.set(null);
            this.confirmDialog.processing = false;
            this.showError('Failed to install plugin', err.error?.message || 'Unknown error');
            console.error('Installation error:', err);
          },
        });
      }
    };
  }

  viewPluginDetail(plugin: Plugin) {
    this.router.navigate(['/setup/marketplace', plugin.pluginId]);
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
        this.showError('Failed to enable plugin', err.error?.message || 'Unknown error');
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
        this.showError('Failed to disable plugin', err.error?.message || 'Unknown error');
        console.error('Disable error:', err);
      },
    });
  }

  uninstallPlugin(plugin: Plugin) {
    this.confirmDialog = {
      isOpen: true,
      title: 'Uninstall Plugin',
      message: `Are you sure you want to uninstall ${plugin.name}? All plugin data will be removed. This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Uninstall',
      processing: false,
      action: () => {
        this.confirmDialog.processing = true;
        this.processing.set(plugin.pluginId);

        this.pluginService.uninstallPlugin(plugin.pluginId).subscribe({
          next: () => {
            this.processing.set(null);
            this.closeConfirmDialog();
            this.loadPlugins();
          },
          error: (err) => {
            this.processing.set(null);
            this.confirmDialog.processing = false;
            this.showError('Failed to uninstall plugin', err.error?.message || 'Unknown error');
            console.error('Uninstall error:', err);
          },
        });
      }
    };
  }

  formatDownloads(count: number): string {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  }

  getPluginGradient(plugin: Plugin): string {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
    ];

    // Use plugin ID to consistently select a gradient
    const index = plugin.pluginId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
    return gradients[index];
  }

  onConfirmAction() {
    if (this.confirmDialog.action) {
      this.confirmDialog.action();
    }
  }

  closeConfirmDialog() {
    this.confirmDialog = {
      isOpen: false,
      title: '',
      message: '',
      type: 'warning',
      confirmText: 'Confirm',
      processing: false,
      action: null
    };
  }

  showError(title: string, message: string) {
    this.confirmDialog = {
      isOpen: true,
      title: title,
      message: message,
      type: 'danger',
      confirmText: 'OK',
      processing: false,
      action: () => this.closeConfirmDialog()
    };
  }
}
