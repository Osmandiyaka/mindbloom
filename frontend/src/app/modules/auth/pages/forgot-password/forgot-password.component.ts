import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, CardComponent],
  template: `
    <div class="auth-shell">
      <app-card class="auth-card">
        <h1>Forgot Password</h1>
        <p class="muted">Enter your username or email. If an account exists, we'll send a reset link.</p>

        <form (ngSubmit)="submit()" class="form">
          <label>
            Username or Email
            <input [(ngModel)]="identifier" name="identifier" required placeholder="you@example.com" />
          </label>

          <app-button variant="primary" type="submit" [disabled]="loading">
            {{ loading ? 'Sending...' : 'Send reset link' }}
          </app-button>

          <p class="success" *ngIf="sent">If an account exists, a reset link has been sent.</p>
          <p class="error" *ngIf="error">{{ error }}</p>

          <a class="link" (click)="back()">Back to sign in</a>
        </form>
      </app-card>
    </div>
  `,
  styles: [`
    .auth-shell { min-height: 100vh; display: grid; place-items: center; background: color-mix(in srgb, var(--color-background, #0f172a) 70%, var(--color-surface, #0b1323) 30%); padding: 1.5rem; }
    .auth-card { width: min(520px, 100%); padding: 1.5rem; display: grid; gap: 0.75rem; background: var(--color-surface, #fff); }
    h1 { margin: 0; color: var(--color-text-primary, #111827); }
    .muted { margin: 0; color: var(--color-text-secondary, #6b7280); }
    .form { display: grid; gap: 0.75rem; }
    label { display: grid; gap: 0.35rem; color: var(--color-text-primary, #111827); font-weight: 700; }
    input { padding: 0.65rem 0.75rem; border-radius: 10px; border: 1px solid var(--color-border, #d1d5db); background: var(--color-surface, #fff); color: var(--color-text-primary, #111827); }
    input:focus { outline: none; border-color: var(--color-primary, #1ea7ff); box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary, #1ea7ff) 18%, transparent); }
    .success { color: var(--color-success, #22c55e); margin: 0; }
    .error { color: var(--color-error, #ef4444); margin: 0; }
    .link { color: var(--color-primary, #1ea7ff); cursor: pointer; }
  `]
})
export class ForgotPasswordComponent {
  identifier = '';
  loading = false;
  sent = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    if (!this.identifier.trim()) return;
    this.loading = true;
    this.error = '';
    this.auth.requestPasswordReset(this.identifier).subscribe({
      next: () => {
        this.loading = false;
        this.sent = true;
      },
      error: () => {
        this.loading = false;
        this.sent = true; // still show generic success
      }
    });
  }

  back() { this.router.navigate(['/login']); }
}
