import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

            <div class="settings-form">
                <div class="settings-section">
                    <h2>📋 Loan Policies</h2>
                    <div class="form-group">
                        <label>Default Loan Duration (days)</label>
                        <input type="number" [(ngModel)]="settings.loanDuration" class="form-input" />
                    </div>
                    <div class="form-group">
                        <label>Maximum Books Per Member</label>
                        <input type="number" [(ngModel)]="settings.maxBooks" class="form-input" />
                    </div>
                    <div class="form-group">
                        <label>Maximum Renewals</label>
                        <input type="number" [(ngModel)]="settings.maxRenewals" class="form-input" />
                    </div>
                </div>

                <div class="settings-section">
                    <h2>💰 Fine Settings</h2>
                    <div class="form-group">
                        <label>Fine Per Day ($)</label>
                        <input type="number" [(ngModel)]="settings.finePerDay" step="0.01" class="form-input" />
                    </div>
                    <div class="form-group">
                        <label>Maximum Fine Before Block ($)</label>
                        <input type="number" [(ngModel)]="settings.maxFine" class="form-input" />
                    </div>
                </div>

                <div class="settings-section">
                    <h2>🔔 Notifications</h2>
                    <div class="form-checkbox">
                        <input type="checkbox" [(ngModel)]="settings.enableNotifications" id="notifications" />
                        <label for="notifications">Enable overdue notifications</label>
                    </div>
                    <div class="form-group">
                        <label>Notification Interval (days)</label>
                        <input type="number" [(ngModel)]="settings.notificationInterval" class="form-input" />
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn-primary" (click)="saveSettings()">
                        {{ saving() ? 'Saving...' : '💾 Save Settings' }}
                    </button>
                </div>
            </div>
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
        .btn-primary { width: 100%; padding: 1rem 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer; }
        .btn-primary:hover { opacity: 0.9; }
    `]
})
export class LibrarySettingsComponent {
    saving = signal(false);

    settings = {
        loanDuration: 14,
        maxBooks: 5,
        maxRenewals: 2,
        finePerDay: 1.00,
        maxFine: 50.00,
        enableNotifications: true,
        notificationInterval: 3
    };

    saveSettings() {
        this.saving.set(true);
        setTimeout(() => {
            this.saving.set(false);
            alert('Settings saved successfully!');
        }, 1000);
    }
}
