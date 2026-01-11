import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { MbAlertComponent, MbButtonComponent, MbFormFieldComponent, MbInputComponent } from '@mindbloom/ui';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, MbButtonComponent, MbFormFieldComponent, MbInputComponent, MbAlertComponent],
    template: `
        <div class="auth-shell">
            <header class="auth-header">
                <div class="auth-logo">
                    <span class="auth-logo__mark" aria-hidden="true"></span>
                    <span class="auth-logo__text">MindBloom</span>
                </div>
                <a class="auth-link" href="mailto:support@mindbloom.com">Help</a>
            </header>

            <div class="auth-layout">
                <section class="auth-panel">
                    <div class="auth-card">
                        <h1>Reset your password</h1>
                        <p class="auth-subtitle">We’ll email reset instructions to your account.</p>

                        @if (error()) {
                        <mb-alert variant="danger">{{ error() }}</mb-alert>
                        }

                        @if (sent()) {
                        <mb-alert variant="success">
                            If an account exists for that email, you’ll receive a reset link shortly.
                        </mb-alert>
                        }

                        <div class="auth-form">
                            @if (!tenantResolved()) {
                            <mb-form-field label="Organization" [controlId]="'forgot-org'" [error]="tenantError()">
                                <mb-input
                                    id="forgot-org"
                                    [value]="tenantCode()"
                                    (valueChange)="tenantCode.set($event); tenantError.set('')"
                                    placeholder="Enter your tenant code"
                                ></mb-input>
                            </mb-form-field>
                            }

                            <mb-form-field label="Email" [controlId]="'forgot-email'">
                                <mb-input
                                    id="forgot-email"
                                    type="email"
                                    [value]="identifier()"
                                    (valueChange)="identifier.set($event); error.set('')"
                                    placeholder="you@school.edu"
                                ></mb-input>
                            </mb-form-field>

                            <mb-button variant="primary" size="lg" [disabled]="loading()" (click)="submit()">
                                {{ loading() ? 'Sending...' : 'Send reset link' }}
                            </mb-button>

                            <button class="auth-text-button" type="button" (click)="back()">Back to sign in</button>
                        </div>
                    </div>
                </section>

                <aside class="auth-brand-panel">
                    <div class="brand-card">
                        <p class="brand-eyebrow">Security first</p>
                        <h2>Account recovery that respects tenant boundaries.</h2>
                        <p>Every reset request is scoped to your organization to prevent confusion and keep accounts secure.</p>
                        <div class="brand-trust">
                            <span>Encrypted delivery</span>
                            <span>Audit-ready logs</span>
                            <span>Tenant scoped</span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    `,
    styles: [`
        .auth-shell { min-height: 100vh; padding: 48px; display: flex; flex-direction: column; gap: 32px; background: var(--mb-color-bg); }
        .auth-header { display: flex; justify-content: space-between; align-items: center; }
        .auth-logo { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
        .auth-logo__mark { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, var(--mb-color-primary), color-mix(in srgb, var(--mb-color-primary) 55%, var(--mb-color-info))); }
        .auth-link { color: var(--mb-color-text-muted); text-decoration: none; font-size: 13px; }
        .auth-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr); gap: 48px; align-items: center; }
        .auth-panel { display: flex; flex-direction: column; align-items: flex-start; }
        .auth-card { width: min(440px, 100%); background: var(--mb-color-surface); border: 1px solid var(--mb-color-border-subtle); border-radius: 14px; padding: 28px; display: grid; gap: 16px; box-shadow: var(--mb-shadow-2); }
        .auth-card h1 { margin: 0; font-size: 22px; font-weight: 600; color: var(--mb-color-text); }
        .auth-subtitle { margin: 0; color: var(--mb-color-text-muted); }
        .auth-form { display: grid; gap: 16px; }
        .auth-text-button { background: none; border: none; color: var(--mb-color-link); cursor: pointer; font-size: 13px; text-align: left; }
        .auth-brand-panel { display: flex; justify-content: center; }
        .brand-card { width: min(520px, 100%); padding: 32px; border-radius: 14px; border: 1px solid var(--mb-color-border); background: linear-gradient(140deg, var(--mb-color-surface), color-mix(in srgb, var(--mb-color-primary) 6%, var(--mb-color-surface))); display: grid; gap: 16px; }
        .brand-eyebrow { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--mb-color-text-subtle); margin: 0; }
        .brand-card h2 { margin: 0; font-size: 24px; font-weight: 600; color: var(--mb-color-text); }
        .brand-card p { margin: 0; color: var(--mb-color-text-muted); }
        .brand-trust { display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px; color: var(--mb-color-text-muted); }
        .brand-trust span { padding: 4px 10px; border-radius: 999px; background: var(--mb-color-surface-2); }
        @media (max-width: 980px) { .auth-shell { padding: 32px; } .auth-layout { grid-template-columns: 1fr; } .auth-brand-panel { order: -1; } }
        @media (max-width: 640px) { .auth-shell { padding: 24px; } .auth-card { width: 100%; } }
    `]
})
export class ForgotPasswordComponent {
    identifier = signal('');
    tenantCode = signal('');
    tenantResolved = signal(false);
    tenantError = signal('');
    loading = signal(false);
    sent = signal(false);
    error = signal('');

    constructor(private auth: AuthService, private tenantService: TenantService, private router: Router) {
        const tenant = this.tenantService.getCurrentTenantValue();
        if (tenant?.subdomain) {
            this.tenantResolved.set(true);
            this.tenantCode.set(tenant.subdomain);
        }
    }

    submit(): void {
        if (!this.identifier().trim()) {
            this.error.set('Enter your email to continue.');
            return;
        }
        if (!this.tenantResolved()) {
            const code = this.tenantCode().trim();
            if (!code) {
                this.tenantError.set('Enter your tenant code.');
                return;
            }
            this.resolveTenantAndSend(code);
            return;
        }
        this.sendReset();
    }

    back(): void {
        this.router.navigate(['/login']);
    }

    private resolveTenantAndSend(code: string): void {
        this.loading.set(true);
        this.tenantError.set('');
        this.tenantService.getTenantByCode(code).subscribe({
            next: (tenant) => {
                this.loading.set(false);
                if (tenant) {
                    this.tenantResolved.set(true);
                    this.sendReset();
                } else {
                    this.tenantError.set('We couldn’t find that organization.');
                }
            },
            error: () => {
                this.loading.set(false);
                this.tenantError.set('We couldn’t find that organization.');
            }
        });
    }

    private sendReset(): void {
        this.loading.set(true);
        this.error.set('');
        this.auth.requestPasswordReset(this.identifier()).subscribe({
            next: () => {
                this.loading.set(false);
                this.sent.set(true);
            },
            error: () => {
                this.loading.set(false);
                this.sent.set(true);
            }
        });
    }
}
