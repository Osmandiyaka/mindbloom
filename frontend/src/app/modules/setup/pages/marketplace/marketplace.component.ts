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
      <!-- Compact Header -->
      <div class="header">
        <h1>Marketplace</h1>
        <div class="search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="onSearchChange()"
            placeholder="Search plugins..."
          />
        </div>
      </div>

      <!-- Minimal Category Filter -->
      <div class="filters">
        <button
          *ngFor="let cat of categories"
          (click)="selectCategory(cat.value)"
          [class.active]="selectedCategory() === cat.value"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading">
        <div class="spinner"></div>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="error">
        <p>{{ error() }}</p>
        <button (click)="loadPlugins()">Retry</button>
      </div>

      <!-- Sleek Plugin Grid -->
      <div *ngIf="!loading() && !error()" class="grid">
        <div *ngFor="let plugin of filteredPlugins()" class="card" (click)="viewPluginDetail(plugin)">
          <div class="card-icon">{{ plugin.iconUrl }}</div>
          
          <div class="card-body">
            <h3>{{ plugin.name }}</h3>
            <p class="author">{{ plugin.author }}</p>
            <p class="description">{{ plugin.description }}</p>
            
            <div class="meta">
              <span>{{ formatDownloads(plugin.downloads) }} downloads</span>
              <span>v{{ plugin.version }}</span>
            </div>
          </div>

          <div class="card-footer">
            <ng-container *ngIf="!plugin.isInstalled">
              <button
                (click)="installPlugin(plugin); $event.stopPropagation()"
                [disabled]="installing() === plugin.pluginId"
                class="btn-install"
              >
                {{ installing() === plugin.pluginId ? 'Installing...' : plugin.price > 0 ? '$' + plugin.price : 'Install' }}
              </button>
            </ng-container>

            <ng-container *ngIf="plugin.isInstalled">
              <span class="installed" [class.active]="plugin.installedStatus === 'enabled'">
                {{ plugin.installedStatus === 'enabled' ? 'Active' : 'Installed' }}
              </span>
            </ng-container>
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
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    /* Sleek Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      gap: 2rem;
    }

    .header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .search-bar {
      flex: 1;
      max-width: 400px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-bar svg {
      position: absolute;
      left: 0.875rem;
      color: #9ca3af;
    }

    .search-bar input {
      width: 100%;
      padding: 0.625rem 0.875rem 0.625rem 2.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.15s;
    }

    .search-bar input:focus {
      border-color: #3b82f6;
    }

    /* Minimal Filters */
    .filters {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
    }

    .filters::-webkit-scrollbar {
      height: 3px;
    }

    .filters::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }

    .filters button {
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      border-radius: 6px;
      transition: all 0.15s;
    }

    .filters button:hover {
      background: #f3f4f6;
      color: #111827;
    }

    .filters button.active {
      background: #111827;
      color: white;
    }

    /* States */
    .loading,
    .error,
    .empty {
      text-align: center;
      padding: 4rem 2rem;
      color: #6b7280;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 2px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error button {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: #111827;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
    }

    /* Lean Grid */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    /* Sleek Card */
    .card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.15s;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
    }

    .card-icon {
      font-size: 2.5rem;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
      border-radius: 8px;
    }

    .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .card-body h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      line-height: 1.3;
    }

    .card-body .author {
      margin: 0;
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .card-body .description {
      margin: 0;
      font-size: 0.8125rem;
      color: #6b7280;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .meta {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .card-footer {
      padding-top: 0.75rem;
      border-top: 1px solid #f3f4f6;
    }

    .btn-install {
      width: 100%;
      padding: 0.625rem;
      background: #111827;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-install:hover:not(:disabled) {
      background: #000;
    }

    .btn-install:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .installed {
      display: block;
      text-align: center;
      padding: 0.625rem;
      background: #f3f4f6;
      color: #6b7280;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .installed.active {
      background: #dcfce7;
      color: #16a34a;
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
