import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LibraryApiService } from '../../services/library-api.service';
import { LibrarySettings } from '../../models/library.models';

@Component({
    selector: 'app-library-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="settings-container">
            <div class="settings-header">
                <h1>⚙️ Library Settings</h1>
                <p class="subtitle">Configure library policies and preferences</p>
            </div>

            @if (loading()) {
                <div class="loading">Loading settings...</div>
            } @else if (settings()) {
                <div class="settings-form">
                    <div class="settings-section">
                        <h2>📋 Loan Policies</h2>
                        <div class="form-group">
                            <label>Default Loan Duration (days)</label>
                            <input type="number" [(ngModel)]="settings()!.defaultLoanPolicy.loanPeriodDays" class="form-input" />
                        </div>
                        <div class="form-group">
                            <label>Maximum Books Per Member</label>
                            <input type="number" [(ngModel)]="settings()!.defaultLoanPolicy.maxItemsCheckedOut" class="form-input" />
                        </div>
                        <div class="form-group">
                            <label>Maximum Renewals</label>
                            <input type="number" [(ngModel)]="settings()!.defaultLoanPolicy.maxRenewals" class="form-input" />
                        </div>
                        <div class="form-group">
                            <label>Maximum Reservations</label>
                            <input type="number" [(ngModel)]="settings()!.defaultLoanPolicy.maxReservations" class="form-input" />
                        </div>
                    </div>

                    <div class="settings-section">
                        <h2>💰 Fine Settings</h2>
                        <div class="form-group">
                            <label>Fine Per Day ($)</label>
                            <input type="number" [(ngModel)]="settings()!.finePolicy.overdueRatePerDay" step="0.01" class="form-input" />
                        </div>
                        <div class="form-group">
                            <label>Maximum Fine Amount ($)</label>
                            <input type="number" [(ngModel)]="settings()!.finePolicy.maxFineAmount" class="form-input" />
                        </div>
                        <div class="form-group">
                            <label>Grace Period (days)</label>
                            <input type="number" [(ngModel)]="settings()!.finePolicy.gracePeriodDays" class="form-input" />
                        </div>
                    </div>

                    <div class="settings-section">
                        <h2>🔧 Features</h2>
                        <div class="form-checkbox">
                            <input type="checkbox" [(ngModel)]="settings()!.featureFlags.enableReservations" id="reservations" />
                            <label for="reservations">Enable reservations system</label>
                        </div>
                        <div class="form-checkbox">
                            <input type="checkbox" [(ngModel)]="settings()!.featureFlags.enableFines" id="fines" />
                            <label for="fines">Enable fines collection</label>
                        </div>
                        <div class="form-checkbox">
                            <input type="checkbox" [(ngModel)]="settings()!.featureFlags.enableBarcodeScanner" id="scanner" />
                            <label for="scanner">Enable barcode scanner</label>
                        </div>
                    </div>

                    <div class="form-actions">
                        @if (success()) {
                            <div class="success-message">✅ {{ success() }}</div>
                        }
                        @if (error()) {
                            <div class="error-message">❌ {{ error() }}</div>
                        }
                        <button class="btn-primary" (click)="saveSettings()" [disabled]="saving()">
                            @if (saving()) {
                                <span class="spinner"></span>
                            } @else {
                                💾 Save Settings
                            }
                        </button>
                    </div>
                </div>
            }
        </div>
    `,
    styles: [`
        .settings-container { padding: 2rem; max-width: 900px; margin: 0 auto; }
        .settings-header { margin-bottom: 2rem; }
        h1 { font-size: 2rem; font-weight: 700; margin: 0 0 0.5rem 0; }
        .subtitle { color: #666; margin: 0; }
        .settings-form { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
        .settings-section { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #e5e7eb; }
        .settings-section:last-of-type { border-bottom: none; }
        h2 { font-size: 1.25rem; margin: 0 0 1.5rem 0; }
        .form-group { margin-bottom: 1.5rem; }
        label { display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; }
        .form-input { width: 100%; padding: 0.75rem 1rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem; }
        .form-input:focus { outline: none; border-color: #667eea; }
        .form-checkbox { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
        .form-checkbox input { width: 20px; height: 20px; cursor: pointer; }
        .form-checkbox label { margin: 0; cursor: pointer; }
        .form-actions { margin-top: 2rem; }
        .success-message { padding: 1rem; background: #d1fae5; color: #065f46; border-radius: 8px; margin-bottom: 1rem; }
        .error-message { padding: 1rem; background: #fee2e2; color: #991b1b; border-radius: 8px; margin-bottom: 1rem; }
        .loading { text-align: center; padding: 3rem; color: #666; }
        .btn-primary { width: 100%; padding: 1rem 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    `]
})
export class LibrarySettingsComponent implements OnInit {
    private apiService = inject(LibraryApiService);

    loading = signal(true);
    saving = signal(false);
    error = signal<string | null>(null);
    success = signal<string | null>(null);

    settings = signal<LibrarySettings | null>(null);

    ngOnInit() {
        this.loadSettings();
    }

    private loadSettings() {
        this.loading.set(true);
        this.apiService.getSettings().subscribe({
            next: (settings) => {
                this.settings.set(settings);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set('Failed to load settings');
                this.loading.set(false);
            }
        });
    }

    saveSettings() {
        if (!this.settings()) return;

        this.saving.set(true);
        this.error.set(null);
        this.success.set(null);

        this.apiService.updateSettings(this.settings()!).subscribe({
            next: (updated) => {
                this.settings.set(updated);
                this.success.set('Settings saved successfully!');
                this.saving.set(false);
            },
            error: (err) => {
                this.error.set('Failed to save settings');
                this.saving.set(false);
            }
        });
    }
}
