import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PluginService, Plugin } from '../../../../core/services/plugin.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-plugin-detail',
  standalone: true,
  imports: [CommonModule, ConfirmationDialogComponent],
  template: `
    <div class="plugin-detail-page">
      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>Loading plugin details...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="error-state">
        <p>❌ {{ error() }}</p>
        <button (click)="loadPlugin()" class="btn-retry">Retry</button>
      </div>

      <!-- Plugin Detail -->
      <div *ngIf="!loading() && !error() && plugin()" class="detail-wrapper">
        <!-- Back Navigation -->
        <button (click)="goBack()" class="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Marketplace
        </button>

        <!-- Main Content -->
        <div class="detail-layout">
          <!-- Left Column - Main Content -->
          <div class="main-content">
            <!-- Header Card -->
            <div class="header-card">
              <div class="plugin-icon-wrapper">
                <div class="plugin-icon">{{ plugin()!.iconUrl }}</div>
              </div>
              <div class="plugin-header-info">
                <h1 class="plugin-title">{{ plugin()!.name }}</h1>
                <p class="plugin-author">by {{ plugin()!.author }}</p>
                <div class="plugin-metadata">
                  <span class="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                    v{{ plugin()!.version }}
                  </span>
                  <span class="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    {{ formatDownloads(plugin()!.downloads) }} downloads
                  </span>
                  <span class="meta-item">Updated {{ plugin()!.updatedAt | date: 'MMM d, yyyy' }}</span>
                </div>
              </div>
            </div>

            <!-- Description Card -->
            <div class="content-card">
              <h2 class="section-title">Description</h2>
              <p class="description-text">{{ plugin()!.description }}</p>
            </div>

            <!-- Version History -->
            <div class="content-card" *ngIf="plugin()!.changelog && plugin()!.changelog.length > 0">
              <h2 class="section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Version History
              </h2>
              <div class="version-list">
                <div class="version-item" *ngFor="let entry of plugin()!.changelog?.slice(0, 3)">
                  <div class="version-header">
                    <span class="version-number">v{{ entry.version }}</span>
                    <span class="version-date">{{ entry.date }}</span>
                  </div>
                  <ul class="version-changes" *ngIf="entry.changes && entry.changes.length > 0">
                    <li *ngFor="let change of entry.changes">{{ change }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Sidebar -->
          <div class="sidebar-content">
            <!-- Status & Action Card -->
            <div class="action-card">
              <!-- Status Badge -->
              <div class="status-section" *ngIf="plugin()!.isInstalled">
                <div class="status-badge" [class.enabled]="plugin()!.installedStatus === 'enabled'" [class.disabled]="plugin()!.installedStatus === 'disabled'">
                  {{ plugin()!.installedStatus === 'enabled' ? 'Plugin Installed (Enabled)' : 'Plugin Installed (Disabled)' }}
                </div>
              </div>
              <div class="status-section" *ngIf="!plugin()!.isInstalled">
                <div class="status-badge not-installed">
                  Not Installed
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="action-buttons">
                <!-- Install Button -->
                <button 
                  *ngIf="!plugin()!.isInstalled"
                  (click)="installPlugin()"
                  [disabled]="processing()"
                  class="btn-install"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {{ processing() ? 'Installing...' : 'Install Plugin' }}
                </button>

                <!-- Enable Button -->
                <button 
                  *ngIf="plugin()!.isInstalled && (plugin()!.installedStatus === 'disabled' || plugin()!.installedStatus === 'installed')"
                  (click)="enablePlugin()"
                  [disabled]="processing()"
                  class="btn-enable"
                >
                  {{ processing() ? 'Enabling...' : 'Enable' }}
                </button>

                <!-- Disable Button -->
                <button 
                  *ngIf="plugin()!.isInstalled && plugin()!.installedStatus === 'enabled'"
                  (click)="disablePlugin()"
                  [disabled]="processing()"
                  class="btn-disable"
                >
                  {{ processing() ? 'Disabling...' : 'Disable' }}
                </button>

                <!-- Uninstall Button -->
                <button 
                  *ngIf="plugin()!.isInstalled"
                  (click)="uninstallPlugin()"
                  [disabled]="processing()"
                  class="btn-uninstall"
                >
                  {{ processing() ? 'Uninstalling...' : 'Uninstall' }}
                </button>
              </div>
            </div>

            <!-- Requirements Card -->
            <div class="info-card">
              <h3 class="card-title">REQUIREMENTS</h3>
              <div class="info-list">
                <div class="info-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                  <span>Platform Version: +</span>
                </div>
                <div class="info-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                  <span>Storage: Minimal</span>
                </div>
                <div class="info-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v20M2 12h20"/>
                  </svg>
                  <span>Memory: Standard</span>
                </div>
              </div>
            </div>

            <!-- Support Card -->
            <div class="info-card">
              <h3 class="card-title">SUPPORT</h3>
              <div class="info-list">
                <div class="info-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <span>Category: {{ plugin()!.category }}</span>
                </div>
                <div class="info-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span>Rating: {{ plugin()!.rating }} / 5.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
    .plugin-detail-page {
      min-height: calc(100vh - 56px);
      background: #f5f7fa;
      padding: 2rem;
    }

    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--color-surface);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360px); }
    }

    .btn-retry {
      padding: 0.75rem 1.5rem;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-retry:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .detail-wrapper {
      max-width: 1200px;
      margin: 0 auto;
    }

    .back-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
      background: none;
      border: none;
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      margin-bottom: 1.5rem;
      transition: color 0.2s;
    }

    .back-button:hover {
      color: var(--color-text-primary);
    }

    .back-button svg {
      width: 20px;
      height: 20px;
    }

    .detail-layout {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 2rem;
      align-items: start;
    }

    @media (max-width: 968px) {
      .detail-layout {
        grid-template-columns: 1fr;
      }

      .sidebar-content {
        order: -1;
      }
    }

    /* Main Content Styles */
    .main-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .header-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      display: flex;
      gap: 1.5rem;
      align-items: flex-start;
    }

    .plugin-icon-wrapper {
      flex-shrink: 0;
    }

    .plugin-icon {
      width: 96px;
      height: 96px;
      font-size: 3.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .plugin-header-info {
      flex: 1;
    }

    .plugin-title {
      margin: 0 0 0.25rem 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: #111827;
      line-height: 1.2;
    }

    .plugin-author {
      margin: 0 0 1rem 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .plugin-metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.813rem;
      color: #6b7280;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .meta-item svg {
      opacity: 0.6;
    }

    .content-card {
      background: white;
      border-radius: 12px;
      padding: 1.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-title {
      margin: 0 0 1rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .section-title svg {
      color: #6b7280;
    }

    .description-text {
      margin: 0;
      color: #4b5563;
      line-height: 1.6;
      font-size: 0.938rem;
    }

    .version-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .version-item {
      padding-bottom: 1.25rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .version-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .version-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .version-number {
      font-weight: 600;
      color: #111827;
      font-size: 0.938rem;
    }

    .version-date {
      font-size: 0.813rem;
      color: #9ca3af;
    }

    .version-changes {
      margin: 0;
      padding-left: 1.25rem;
      color: #6b7280;
      font-size: 0.875rem;
      line-height: 1.6;
    }

    .version-changes li {
      margin-bottom: 0.25rem;
    }

    /* Sidebar Styles */
    .sidebar-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      position: sticky;
      top: calc(56px + 2rem);
    }

    .action-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .status-section {
      margin-bottom: 1.25rem;
    }

    .status-badge {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.813rem;
      font-weight: 600;
      text-align: center;
      width: 100%;
    }

    .status-badge.not-installed {
      background: #f3f4f6;
      color: #4b5563;
    }

    .status-badge.enabled {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge.disabled {
      background: #fef3c7;
      color: #92400e;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .action-buttons button {
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.938rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .action-buttons button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-install {
      background: #000051;
      color: white;
    }

    .btn-install:hover:not(:disabled) {
      background: #000040;
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
      background: transparent;
      color: #ef4444;
      border: 1px solid #fca5a5;
    }

    .btn-uninstall:hover:not(:disabled) {
      background: #fef2f2;
      border-color: #ef4444;
    }

    .info-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .card-title {
      margin: 0 0 1rem 0;
      font-size: 0.75rem;
      font-weight: 700;
      color: #9ca3af;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #4b5563;
      font-size: 0.875rem;
    }

    .info-item svg {
      color: #9ca3af;
      flex-shrink: 0;
    }

    .info-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #6b7280;
      font-size: 0.875rem;
      text-decoration: none;
      transition: color 0.2s;
    }

    .info-link:hover {
      color: var(--color-primary);
    }

    .info-link svg {
      color: #9ca3af;
      flex-shrink: 0;
      transition: color 0.2s;
    }

    .info-link:hover svg {
      color: var(--color-primary);
    }
  `]
})
export class PluginDetailComponent implements OnInit {
  plugin = signal<Plugin | null>(null);
  loading = signal(true);
  error = signal('');
  processing = signal(false);
  activeTab = signal<'overview' | 'changelog' | 'permissions'>('overview');

  confirmDialog = {
    isOpen: false,
    title: '',
    message: '',
    type: 'warning' as 'warning' | 'danger' | 'info' | 'success',
    confirmText: 'Confirm',
    processing: false,
    action: null as (() => void) | null
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pluginService: PluginService
  ) { }

  ngOnInit() {
    const pluginId = this.route.snapshot.paramMap.get('id');
    if (pluginId) {
      this.loadPlugin();
    } else {
      this.error.set('Plugin ID not provided');
    }
  }

  loadPlugin() {
    this.loading.set(true);
    this.error.set('');

    const pluginId = this.route.snapshot.paramMap.get('id');

    this.pluginService.getMarketplace(undefined, undefined).subscribe({
      next: (plugins) => {
        const foundPlugin = plugins.find(p => p.pluginId === pluginId);
        if (foundPlugin) {
          this.plugin.set(foundPlugin);
        } else {
          this.error.set('Plugin not found');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load plugin details');
        this.loading.set(false);
        console.error('Error loading plugin:', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/setup/marketplace']);
  }

  installPlugin() {
    const plugin = this.plugin();
    if (!plugin) return;

    this.confirmDialog = {
      isOpen: true,
      title: 'Install Plugin',
      message: `Install ${plugin.name}? ${plugin.price > 0 ? `This will charge $${plugin.price} to your account.` : 'This plugin is free.'}`,
      type: 'info',
      confirmText: plugin.price > 0 ? `Pay $${plugin.price}` : 'Install',
      processing: false,
      action: () => {
        this.confirmDialog.processing = true;
        this.processing.set(true);

        this.pluginService.installPlugin(plugin.pluginId).subscribe({
          next: () => {
            this.processing.set(false);
            this.closeConfirmDialog();
            this.loadPlugin();
          },
          error: (err) => {
            this.processing.set(false);
            this.confirmDialog.processing = false;
            this.showError('Failed to install plugin', err.error?.message || 'Unknown error');
            console.error('Installation error:', err);
          },
        });
      }
    };
  }

  enablePlugin() {
    const plugin = this.plugin();
    if (!plugin) return;

    this.processing.set(true);

    this.pluginService.enablePlugin(plugin.pluginId).subscribe({
      next: () => {
        this.processing.set(false);
        this.loadPlugin();
      },
      error: (err) => {
        this.processing.set(false);
        this.showError('Failed to enable plugin', err.error?.message || 'Unknown error');
        console.error('Enable error:', err);
      },
    });
  }

  disablePlugin() {
    const plugin = this.plugin();
    if (!plugin) return;

    this.processing.set(true);

    this.pluginService.disablePlugin(plugin.pluginId).subscribe({
      next: () => {
        this.processing.set(false);
        this.loadPlugin();
      },
      error: (err) => {
        this.processing.set(false);
        this.showError('Failed to disable plugin', err.error?.message || 'Unknown error');
        console.error('Disable error:', err);
      },
    });
  }

  uninstallPlugin() {
    const plugin = this.plugin();
    if (!plugin) return;

    this.confirmDialog = {
      isOpen: true,
      title: 'Uninstall Plugin',
      message: `Are you sure you want to uninstall ${plugin.name}? All plugin data will be removed. This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Uninstall',
      processing: false,
      action: () => {
        this.confirmDialog.processing = true;
        this.processing.set(true);

        this.pluginService.uninstallPlugin(plugin.pluginId).subscribe({
          next: () => {
            this.processing.set(false);
            this.closeConfirmDialog();
            this.loadPlugin();
          },
          error: (err) => {
            this.processing.set(false);
            this.confirmDialog.processing = false;
            this.showError('Failed to uninstall plugin', err.error?.message || 'Unknown error');
            console.error('Uninstall error:', err);
          },
        });
      }
    };
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

  formatDownloads(count: number): string {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  }
}
