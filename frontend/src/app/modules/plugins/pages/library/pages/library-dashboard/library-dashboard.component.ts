import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LibraryApiService } from '../../services/library-api.service';
import { DashboardStats } from '../../models/library.models';

@Component({
    selector: 'app-library-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
        <div class="library-dashboard">
            <!-- Loading State -->
            <div class="loading-overlay" *ngIf="loading()">
                <div class="spinner"></div>
                <p>Loading dashboard...</p>
            </div>

            <!-- Error State -->
            <div class="error-banner" *ngIf="error()">
                <span class="error-icon">⚠️</span>
                <span>{{ error() }}</span>
                <button class="retry-btn" (click)="loadDashboardData()">Retry</button>
            </div>

            <!-- Header -->
            <div class="dashboard-header">
                <div>
                    <h1>📚 Library Management</h1>
                    <p class="subtitle">Manage your school library efficiently</p>
                </div>
                <div class="header-actions">
                    <button class="btn-secondary" routerLink="/plugins/library/circulation">
                        <span class="icon">🔍</span>
                        Quick Scan
                    </button>
                    <button class="btn-primary" routerLink="/plugins/library/books/add">
                        <span class="icon">➕</span>
                        Add Book
                    </button>
                </div>
            </div>

            <!-- Quick Stats -->
            <div class="stats-grid">
                <div class="stat-card primary">
                    <div class="stat-icon">📖</div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats().totalTitles.toLocaleString() }}</div>
                        <div class="stat-label">Total Titles</div>
                    </div>
                    <div class="stat-trend positive">{{ stats().totalCopies.toLocaleString() }} copies</div>
                </div>

                <div class="stat-card success">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats().availableCopies.toLocaleString() }}</div>
                        <div class="stat-label">Available</div>
                    </div>
                    <div class="stat-progress">
                        <div class="progress-bar" 
                             [style.width.%]="(stats().availableCopies / stats().totalCopies) * 100">
                        </div>
                    </div>
                </div>

                <div class="stat-card warning">
                    <div class="stat-icon">📤</div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats().checkedOutCopies.toLocaleString() }}</div>
                        <div class="stat-label">Checked Out</div>
                    </div>
                    <button class="stat-action" routerLink="/plugins/library/circulation">
                        View All →
                    </button>
                </div>

                <div class="stat-card danger" *ngIf="stats().overdueItems > 0">
                    <div class="stat-icon danger">⚠️</div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats().overdueItems }}</div>
                        <div class="stat-label">Overdue</div>
                    </div>
                    <div class="stat-trend negative">Needs attention</div>
                </div>

                <div class="stat-card info">
                    <div class="stat-icon">📋</div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats().checkedOutCopies.toLocaleString() }}</div>
                        <div class="stat-label">Active Loans</div>
                    </div>
                    <button class="stat-action" routerLink="/plugins/library/circulation">
                        Manage →
                    </button>
                </div>

                <div class="stat-card accent">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <div class="stat-value">{{ '$' + stats().totalFinesCollected.toLocaleString() }}</div>
                        <div class="stat-label">Total Fines</div>
                    </div>
                    <div class="stat-trend">{{ stats().overdueItems }} overdue</div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions-section">
                <h2>Quick Actions</h2>
                <div class="actions-grid">
                    <button class="action-card" routerLink="/plugins/library/circulation">
                        <div class="action-icon">📥</div>
                        <div class="action-title">Issue Book</div>
                        <div class="action-desc">Scan barcode to issue</div>
                    </button>

                    <button class="action-card" routerLink="/plugins/library/circulation">
                        <div class="action-icon">📤</div>
                        <div class="action-title">Return Book</div>
                        <div class="action-desc">Process returns</div>
                    </button>

                    <button class="action-card" routerLink="/plugins/library/catalog">
                        <div class="action-icon">🔍</div>
                        <div class="action-title">Search Catalog</div>
                        <div class="action-desc">Find books quickly</div>
                    </button>

                    <button class="action-card" routerLink="/plugins/library/books/add">
                        <div class="action-icon">➕</div>
                        <div class="action-title">Add New Book</div>
                        <div class="action-desc">Expand collection</div>
                    </button>

                    <button class="action-card" routerLink="/plugins/library/members">
                        <div class="action-icon">👤</div>
                        <div class="action-title">Member Profile</div>
                        <div class="action-desc">View borrowing history</div>
                    </button>

                    <button class="action-card" routerLink="/plugins/library/reports">
                        <div class="action-icon">📊</div>
                        <div class="action-title">Reports</div>
                        <div class="action-desc">Analytics & insights</div>
                    </button>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="recent-activity-section" *ngIf="loading() === false">
                <h2>Recent Activity</h2>
                <div class="activity-list">
                    <div class="activity-item">
                        <div class="activity-icon success">📥</div>
                        <div class="activity-content">
                            <div class="activity-title">Book Issued</div>
                            <div class="activity-desc">Introduction to Algorithms issued to John Doe</div>
                        </div>
                        <div class="activity-time">2 mins ago</div>
                    </div>

                    <div class="activity-item">
                        <div class="activity-icon primary">📤</div>
                        <div class="activity-content">
                            <div class="activity-title">Book Returned</div>
                            <div class="activity-desc">Clean Code returned by Jane Smith</div>
                        </div>
                        <div class="activity-time">15 mins ago</div>
                    </div>

                    <div class="activity-item">
                        <div class="activity-icon info">➕</div>
                        <div class="activity-content">
                            <div class="activity-title">New Book Added</div>
                            <div class="activity-desc">Design Patterns added to catalog (5 copies)</div>
                        </div>
                        <div class="activity-time">1 hour ago</div>
                    </div>

                    <div class="activity-item">
                        <div class="activity-icon warning">⚠️</div>
                        <div class="activity-content">
                            <div class="activity-title">Overdue Notice</div>
                            <div class="activity-desc">The Pragmatic Programmer is 3 days overdue</div>
                        </div>
                        <div class="activity-time">2 hours ago</div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .library-dashboard {
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
            position: relative;
        }

        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.95);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #f3f4f6;
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .loading-overlay p {
            margin-top: 1rem;
            color: #666;
            font-weight: 500;
        }

        .error-banner {
            background: #fee2e2;
            color: #991b1b;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .error-icon {
            font-size: 1.5rem;
        }

        .retry-btn {
            margin-left: auto;
            padding: 0.5rem 1rem;
            background: white;
            color: #991b1b;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .retry-btn:hover {
            background: #fef2f2;
        }

        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2rem;
        }

        h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 0.5rem 0;
        }

        .subtitle {
            color: #666;
            font-size: 1rem;
            margin: 0;
        }

        .header-actions {
            display: flex;
            gap: 1rem;
        }

        .btn-primary, .btn-secondary {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-size: 0.9375rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
        }

        .btn-secondary {
            background: white;
            color: #667eea;
            border: 2px solid #667eea;
        }

        .btn-secondary:hover {
            background: #f7f8fc;
        }

        .icon {
            font-size: 1.2rem;
        }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }

        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            position: relative;
            overflow: hidden;
            transition: all 0.3s;
        }

        .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--accent-color), var(--accent-light));
        }

        .stat-card.primary { --accent-color: #667eea; --accent-light: #764ba2; }
        .stat-card.success { --accent-color: #10b981; --accent-light: #34d399; }
        .stat-card.warning { --accent-color: #f59e0b; --accent-light: #fbbf24; }
        .stat-card.danger { --accent-color: #ef4444; --accent-light: #f87171; }
        .stat-card.info { --accent-color: #3b82f6; --accent-light: #60a5fa; }
        .stat-card.accent { --accent-color: #8b5cf6; --accent-light: #a78bfa; }

        .stat-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }

        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 0.25rem;
        }

        .stat-label {
            font-size: 0.875rem;
            color: #666;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .stat-trend {
            margin-top: 0.75rem;
            font-size: 0.8125rem;
            font-weight: 500;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            display: inline-block;
        }

        .stat-trend.positive {
            background: #d1fae5;
            color: #065f46;
        }

        .stat-trend.negative {
            background: #fee2e2;
            color: #991b1b;
        }

        .stat-progress {
            margin-top: 1rem;
            height: 6px;
            background: #f3f4f6;
            border-radius: 3px;
            overflow: hidden;
        }

        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, var(--accent-color), var(--accent-light));
            border-radius: 3px;
            transition: width 0.6s ease;
        }

        .stat-action {
            margin-top: 0.75rem;
            background: none;
            border: none;
            color: var(--accent-color);
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        .stat-action:hover {
            text-decoration: underline;
        }

        /* Quick Actions */
        .quick-actions-section, .recent-activity-section {
            margin-bottom: 3rem;
        }

        h2 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 1.5rem 0;
        }

        .actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }

        .action-card {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
        }

        .action-card:hover {
            border-color: #667eea;
            background: #f7f8fc;
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(102, 126, 234, 0.15);
        }

        .action-icon {
            font-size: 2.5rem;
            margin-bottom: 0.75rem;
        }

        .action-title {
            font-size: 1rem;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 0.5rem;
        }

        .action-desc {
            font-size: 0.875rem;
            color: #666;
        }

        /* Recent Activity */
        .activity-list {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }

        .activity-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid #f3f4f6;
            transition: background 0.2s;
        }

        .activity-item:last-child {
            border-bottom: none;
        }

        .activity-item:hover {
            background: #f9fafb;
        }

        .activity-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            flex-shrink: 0;
        }

        .activity-icon.success { background: #d1fae5; }
        .activity-icon.primary { background: #dbeafe; }
        .activity-icon.info { background: #e0e7ff; }
        .activity-icon.warning { background: #fef3c7; }

        .activity-content {
            flex: 1;
        }

        .activity-title {
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 0.25rem;
        }

        .activity-desc {
            font-size: 0.875rem;
            color: #666;
        }

        .activity-time {
            font-size: 0.8125rem;
            color: #9ca3af;
            flex-shrink: 0;
        }
    `]
})
export class LibraryDashboardComponent implements OnInit {
    private apiService = inject(LibraryApiService);

    loading = signal(true);
    error = signal<string | null>(null);
    stats = signal<DashboardStats>({
        totalTitles: 0,
        totalCopies: 0,
        availableCopies: 0,
        checkedOutCopies: 0,
        overdueItems: 0,
        activeReservations: 0,
        totalFinesCollected: 0,
        patronsWithFines: 0
    });

    ngOnInit() {
        this.loadDashboardData();
    }

    loadDashboardData() {
        this.loading.set(true);
        this.error.set(null);

        this.apiService.getDashboardStats().subscribe({
            next: (data) => {
                this.stats.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load dashboard stats:', err);
                this.error.set('Failed to load dashboard data. Please try again.');
                this.loading.set(false);
            }
        });
    }
}
