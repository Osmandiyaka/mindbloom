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
    <div class="plugin-detail-container">
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
      <div *ngIf="!loading() && !error() && plugin()" class="plugin-detail">
        <!-- Header -->
        <div class="detail-header">
          <button (click)="goBack()" class="btn-back">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Marketplace
          </button>
        </div>

        <!-- Plugin Info Card -->
        <div class="plugin-info-card">
          <div class="plugin-hero">
            <div class="plugin-icon-large">{{ plugin()!.iconUrl }}</div>
            <div class="plugin-title-section">
              <h1>{{ plugin()!.name }}</h1>
              <p class="plugin-author">by {{ plugin()!.author }}</p>
              <div class="plugin-meta-inline">
                <span class="meta-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {{ plugin()!.rating }} ({{ plugin()!.ratingCount }} reviews)
                </span>
                <span class="meta-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {{ formatDownloads(plugin()!.downloads) }} downloads
                </span>
                <span class="meta-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                  v{{ plugin()!.version }}
                </span>
              </div>
            </div>
            <div class="plugin-actions">
              <!-- Not Installed -->
              <ng-container *ngIf="!plugin()!.isInstalled">
                <button 
                  (click)="installPlugin()"
                  [disabled]="processing()"
                  class="btn-primary btn-large"
                >
                  {{ processing() ? '⏳ Installing...' : plugin()!.price > 0 ? '💳 Buy for $' + plugin()!.price : '⬇️ Install Free' }}
                </button>
              </ng-container>

              <!-- Installed -->
              <ng-container *ngIf="plugin()!.isInstalled">
                <div class="status-badge-large" [class]="'status-' + plugin()!.installedStatus">
                  {{ plugin()!.installedStatus === 'enabled' ? '✓ Enabled' : plugin()!.installedStatus === 'disabled' ? '⏸ Disabled' : '📦 Installed' }}
                </div>
                <div class="action-buttons">
                  <button 
                    *ngIf="plugin()!.installedStatus === 'disabled' || plugin()!.installedStatus === 'installed'"
                    (click)="enablePlugin()"
                    [disabled]="processing()"
                    class="btn-success"
                  >
                    ▶️ Enable
                  </button>
                  <button 
                    *ngIf="plugin()!.installedStatus === 'enabled'"
                    (click)="disablePlugin()"
                    [disabled]="processing()"
                    class="btn-warning"
                  >
                    ⏸ Pause
                  </button>
                  <button 
                    (click)="uninstallPlugin()"
                    [disabled]="processing()"
                    class="btn-danger"
                  >
                    🗑️ Uninstall
                  </button>
                </div>
              </ng-container>
            </div>
          </div>

          <!-- Price Badge -->
          <div *ngIf="plugin()!.price > 0 && !plugin()!.isInstalled" class="price-badge">
            <span class="price-label">Price</span>
            <span class="price-amount">\${{ plugin()!.price }}</span>
          </div>
          <div *ngIf="plugin()!.price === 0" class="price-badge free">
            <span class="price-label">Free</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="detail-tabs">
          <button 
            (click)="activeTab.set('overview')" 
            [class.active]="activeTab() === 'overview'"
            class="tab-btn"
          >
            Overview
          </button>
          <button 
            (click)="activeTab.set('changelog')" 
            [class.active]="activeTab() === 'changelog'"
            class="tab-btn"
          >
            Changelog
          </button>
          <button 
            (click)="activeTab.set('permissions')" 
            [class.active]="activeTab() === 'permissions'"
            class="tab-btn"
          >
            Permissions
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Overview Tab -->
          <div *ngIf="activeTab() === 'overview'" class="tab-pane">
            <div class="content-section">
              <h2>Description</h2>
              <p class="description">{{ plugin()!.description }}</p>
            </div>

            <div class="content-section">
              <h2>Features</h2>
              <div class="features-grid">
                <div class="feature-item" *ngFor="let tag of plugin()!.tags">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {{ tag }}
                </div>
              </div>
            </div>

            <div class="content-section" *ngIf="plugin()!.screenshots && plugin()!.screenshots.length > 0">
              <h2>Screenshots</h2>
              <div class="screenshots-grid">
                <img *ngFor="let screenshot of plugin()!.screenshots" [src]="screenshot" alt="Screenshot" class="screenshot">
              </div>
            </div>

            <div class="content-section">
              <h2>Information</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Category</span>
                  <span class="info-value">{{ plugin()!.category }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Version</span>
                  <span class="info-value">{{ plugin()!.version }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Author</span>
                  <span class="info-value">{{ plugin()!.author }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Downloads</span>
                  <span class="info-value">{{ formatDownloads(plugin()!.downloads) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Changelog Tab -->
          <div *ngIf="activeTab() === 'changelog'" class="tab-pane">
            <div class="content-section">
              <h2>Version History</h2>
              <div class="changelog-list">
                <div class="changelog-item" *ngFor="let entry of plugin()!.changelog">
                  <div class="changelog-version">v{{ entry.version }}</div>
                  <div class="changelog-date">{{ entry.date }}</div>
                  <ul class="changelog-changes">
                    <li *ngFor="let change of entry.changes">{{ change }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Permissions Tab -->
          <div *ngIf="activeTab() === 'permissions'" class="tab-pane">
            <div class="content-section">
              <h2>Required Permissions</h2>
              <p class="permissions-intro">This plugin requires the following permissions to function properly:</p>
              <div class="permissions-list">
                <div class="permission-item" *ngFor="let permission of plugin()!.manifest?.permissions || []">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>{{ permission }}</span>
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
    .plugin-detail-container {
      padding: 0;
      max-width: 1200px;
      margin: 0 auto;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .detail-header {
      margin-bottom: 2rem;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text-secondary);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-back:hover {
      background: var(--color-surface-hover);
      color: var(--color-primary);
      border-color: var(--color-primary);
    }

    .plugin-info-card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      margin-bottom: 2rem;
      position: relative;
      overflow: hidden;
    }

    .plugin-hero {
      display: flex;
      gap: 2rem;
      align-items: flex-start;
    }

    .plugin-icon-large {
      font-size: 5rem;
      width: 120px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-radius: 20px;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .plugin-title-section {
      flex: 1;
    }

    .plugin-title-section h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 800;
      color: var(--color-text-primary);
    }

    .plugin-author {
      margin: 0 0 1rem 0;
      color: var(--color-text-secondary);
      font-size: 1rem;
    }

    .plugin-meta-inline {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .meta-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--color-surface);
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-secondary);
    }

    .meta-badge svg {
      color: var(--color-primary);
    }

    .plugin-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-end;
    }

    .status-badge-large {
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 1rem;
      text-align: center;
      min-width: 150px;
    }

    .status-badge-large.status-enabled {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      color: #047857;
    }

    .status-badge-large.status-disabled,
    .status-badge-large.status-installed {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #92400e;
    }

    .action-buttons {
      display: flex;
      gap: 0.75rem;
    }

    .btn-primary, .btn-success, .btn-warning, .btn-danger {
      padding: 0.875rem 1.75rem;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .btn-large {
      padding: 1rem 2.5rem;
      font-size: 1.125rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
    }

    .btn-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
    }

    .btn-warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .btn-warning:hover:not(:disabled) {
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    }

    .btn-danger {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .price-badge {
      position: absolute;
      top: 2rem;
      right: 2rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      text-align: center;
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .price-badge.free {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .price-label {
      display: block;
      font-size: 0.75rem;
      opacity: 0.9;
      font-weight: 600;
    }

    .price-amount {
      display: block;
      font-size: 1.5rem;
      font-weight: 800;
      margin-top: 0.25rem;
    }

    .detail-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--color-border);
      margin-bottom: 2rem;
    }

    .tab-btn {
      padding: 1rem 2rem;
      border: none;
      background: transparent;
      color: var(--color-text-secondary);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
    }

    .tab-btn:hover {
      color: var(--color-primary);
    }

    .tab-btn.active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
    }

    .tab-content {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    .content-section {
      margin-bottom: 2.5rem;
    }

    .content-section:last-child {
      margin-bottom: 0;
    }

    .content-section h2 {
      margin: 0 0 1.5rem 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .description {
      font-size: 1.125rem;
      line-height: 1.8;
      color: var(--color-text-secondary);
      margin: 0;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--color-surface);
      border-radius: 8px;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .feature-item svg {
      color: var(--color-primary);
      flex-shrink: 0;
    }

    .screenshots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .screenshot {
      width: 100%;
      border-radius: 12px;
      border: 2px solid var(--color-border);
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .screenshot:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .info-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .changelog-list {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .changelog-item {
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--color-border);
    }

    .changelog-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .changelog-version {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.25rem;
    }

    .changelog-date {
      font-size: 0.875rem;
      color: var(--color-text-tertiary);
      margin-bottom: 1rem;
    }

    .changelog-changes {
      margin: 0;
      padding-left: 1.5rem;
    }

    .changelog-changes li {
      margin-bottom: 0.5rem;
      line-height: 1.6;
      color: var(--color-text-secondary);
    }

    .permissions-intro {
      margin-bottom: 1.5rem;
      color: var(--color-text-secondary);
    }

    .permissions-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .permission-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: var(--color-surface);
      border-radius: 8px;
      border-left: 4px solid var(--color-primary);
    }

    .permission-item svg {
      color: var(--color-primary);
      flex-shrink: 0;
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--color-text-secondary);
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--color-border);
      border-top-color: var(--color-primary);
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
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .plugin-hero {
        flex-direction: column;
      }

      .plugin-actions {
        width: 100%;
        align-items: stretch;
      }

      .action-buttons {
        flex-direction: column;
      }

      .price-badge {
        position: static;
        margin-top: 1rem;
      }
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
