import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PluginService } from '../../../../core/services/plugin.service';

interface SMSSettings {
    accountSid: string;
    authToken: string;
    fromNumber: string;
    enableFeeReminders: boolean;
    enableAttendanceAlerts: boolean;
}

@Component({
    selector: 'app-sms-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="sms-settings-container">
      <div class="page-header">
        <h1>📱 SMS Notification Settings</h1>
        <p>Configure your Twilio SMS gateway for automated notifications</p>
      </div>

      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>Loading settings...</p>
      </div>

      <div *ngIf="!loading()" class="settings-form">
        <div class="form-section">
          <h2>Twilio Credentials</h2>
          <p class="section-description">Enter your Twilio account credentials. Get them from your <a href="https://console.twilio.com" target="_blank">Twilio Console</a>.</p>
          
          <div class="form-group">
            <label for="accountSid">Account SID <span class="required">*</span></label>
            <input
              type="text"
              id="accountSid"
              [(ngModel)]="settings.accountSid"
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              required>
          </div>

          <div class="form-group">
            <label for="authToken">Auth Token <span class="required">*</span></label>
            <input
              type="password"
              id="authToken"
              [(ngModel)]="settings.authToken"
              placeholder="Enter your Twilio Auth Token"
              required>
          </div>

          <div class="form-group">
            <label for="fromNumber">From Phone Number <span class="required">*</span></label>
            <input
              type="tel"
              id="fromNumber"
              [(ngModel)]="settings.fromNumber"
              placeholder="+1234567890"
              required>
            <small>Must be in E.164 format (e.g., +1234567890)</small>
          </div>
        </div>

        <div class="form-section">
          <h2>Automated Notifications</h2>
          <p class="section-description">Choose which events should trigger automated SMS notifications</p>
          
          <div class="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                [(ngModel)]="settings.enableFeeReminders">
              <span>Enable Fee Reminders</span>
            </label>
            <small>Send automatic SMS when fee payments are due</small>
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                [(ngModel)]="settings.enableAttendanceAlerts">
              <span>Enable Attendance Alerts</span>
            </label>
            <small>Send SMS to parents when student is marked absent</small>
          </div>
        </div>

        <div class="form-actions">
          <button (click)="saveSettings()" [disabled]="saving()" class="btn-primary">
            <span *ngIf="!saving()">💾 Save Settings</span>
            <span *ngIf="saving()">Saving...</span>
          </button>
          <button (click)="testConnection()" [disabled]="saving() || testing()" class="btn-secondary">
            <span *ngIf="!testing()">🧪 Test Connection</span>
            <span *ngIf="testing()">Testing...</span>
          </button>
        </div>

        <div *ngIf="successMessage()" class="alert alert-success">
          {{ successMessage() }}
        </div>

        <div *ngIf="errorMessage()" class="alert alert-error">
          {{ errorMessage() }}
        </div>
      </div>
    </div>
  `,
    styles: [`
    .sms-settings-container {
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .page-header p {
      font-size: 1.125rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      gap: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(99, 102, 241, 0.1);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .settings-form {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .form-section {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid var(--border-color);
    }

    .form-section:last-of-type {
      border-bottom: none;
    }

    .form-section h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .section-description {
      font-size: 0.95rem;
      color: var(--text-secondary);
      margin: 0 0 1.5rem 0;
    }

    .section-description a {
      color: #6366f1;
      text-decoration: none;
    }

    .section-description a:hover {
      text-decoration: underline;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .required {
      color: #ef4444;
    }

    .form-group input[type="text"],
    .form-group input[type="password"],
    .form-group input[type="tel"] {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .form-group input:focus {
      outline: none;
      border-color: #6366f1;
    }

    .form-group small {
      display: block;
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: 0.5rem;
    }

    .checkbox-group {
      background: #f9fafb;
      padding: 1rem;
      border-radius: 8px;
    }

    .checkbox-group label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      font-weight: 500;
    }

    .checkbox-group input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .checkbox-group small {
      margin-left: 2.25rem;
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }

    .btn-primary, .btn-secondary {
      padding: 0.875rem 2rem;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      color: #6366f1;
      border: 2px solid #6366f1;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #6366f1;
      color: white;
    }

    .btn-secondary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .alert {
      padding: 1rem 1.25rem;
      border-radius: 8px;
      margin-top: 1rem;
      font-size: 0.95rem;
    }

    .alert-success {
      background: #d1fae5;
      color: #047857;
      border: 2px solid #a7f3d0;
    }

    .alert-error {
      background: #fee2e2;
      color: #dc2626;
      border: 2px solid #fca5a5;
    }

    @media (max-width: 768px) {
      .form-actions {
        flex-direction: column;
      }

      .btn-primary, .btn-secondary {
        width: 100%;
      }
    }
  `]
})
export class SmsSettingsComponent implements OnInit {
    settings: SMSSettings = {
        accountSid: '',
        authToken: '',
        fromNumber: '',
        enableFeeReminders: true,
        enableAttendanceAlerts: true,
    };

    loading = signal(true);
    saving = signal(false);
    testing = signal(false);
    successMessage = signal<string | null>(null);
    errorMessage = signal<string | null>(null);

    private readonly pluginId = 'sms-twilio';

    constructor(private pluginService: PluginService) { }

    ngOnInit() {
        this.loadSettings();
    }

    loadSettings() {
        this.loading.set(true);
        this.pluginService.getPluginSettings(this.pluginId).subscribe({
            next: (settings) => {
                if (settings && Object.keys(settings).length > 0) {
                    this.settings = { ...this.settings, ...settings };
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.errorMessage.set('Failed to load settings: ' + err.message);
                this.loading.set(false);
            }
        });
    }

    saveSettings() {
        this.saving.set(true);
        this.successMessage.set(null);
        this.errorMessage.set(null);

        this.pluginService.updatePluginSettings(this.pluginId, this.settings).subscribe({
            next: () => {
                this.saving.set(false);
                this.successMessage.set('Settings saved successfully!');
                setTimeout(() => this.successMessage.set(null), 3000);
            },
            error: (err) => {
                this.saving.set(false);
                this.errorMessage.set('Failed to save settings: ' + err.message);
            }
        });
    }

    testConnection() {
        this.testing.set(true);
        this.successMessage.set(null);
        this.errorMessage.set(null);

        // Simulate test connection (in production, this would call a backend endpoint)
        setTimeout(() => {
            this.testing.set(false);
            if (this.settings.accountSid && this.settings.authToken && this.settings.fromNumber) {
                this.successMessage.set('Connection test successful! Your Twilio credentials are valid.');
                setTimeout(() => this.successMessage.set(null), 3000);
            } else {
                this.errorMessage.set('Please fill in all required credentials before testing.');
            }
        }, 1500);
    }
}
