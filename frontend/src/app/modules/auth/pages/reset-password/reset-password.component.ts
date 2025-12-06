import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, CardComponent],
  template: `
    <div class="auth-shell">
      <app-card class="auth-card">
        <h1>Reset Password</h1>
        <p class="muted">Create a new password for your account.</p>

        <ng-container *ngIf="!invalidToken; else invalid">
          <form (ngSubmit)="submit()" class="form">
            <label>
              New password
              <input type="password" [(ngModel)]="password" name="password" required (input)="score()" />
              <span class="muted small">Strength: {{ strengthLabel }}</span>
            </label>
            <label>
              Confirm password
              <input type="password" [(ngModel)]="confirm" name="confirm" required />
            </label>
            <div class="meter">
              <div class="bar" [style.width.%]="strength * 25" [class.weak]="strength<2" [class.ok]="strength===2" [class.good]="strength===3" [class.strong]="strength>=4"></div>
            </div>

            <p class="error" *ngIf="error">{{ error }}</p>
            <app-button variant="primary" type="submit" [disabled]="loading">
              {{ loading ? 'Resetting...' : 'Reset Password' }}
            </app-button>
          </form>
        </ng-container>
        <ng-template #invalid>
          <p class="error">This link is invalid or expired.</p>
          <a class="link" (click)="toForgot()">Request a new link</a>
        </ng-template>
      </app-card>
    </div>
  `,
  styles: [`
    .auth-shell { min-height: 100vh; display: grid; place-items: center; background: color-mix(in srgb, var(--color-background, #0f172a) 70%, var(--color-surface, #0b1323) 30%); padding: 1.5rem; }
    .auth-card { width: min(520px, 100%); padding: 1.5rem; display: grid; gap: 0.75rem; background: var(--color-surface, #fff); }
    h1 { margin: 0; color: var(--color-text-primary, #111827); }
    .muted { margin: 0; color: var(--color-text-secondary, #6b7280); }
    .small { font-size: 0.9rem; }
    .form { display: grid; gap: 0.85rem; }
    label { display: grid; gap: 0.35rem; color: var(--color-text-primary, #111827); font-weight: 700; }
    input { padding: 0.65rem 0.75rem; border-radius: 10px; border: 1px solid var(--color-border, #d1d5db); background: var(--color-surface, #fff); color: var(--color-text-primary, #111827); }
    input:focus { outline: none; border-color: var(--color-primary, #1ea7ff); box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary, #1ea7ff) 18%, transparent); }
    .meter { height: 6px; background: color-mix(in srgb, var(--color-surface, #f8fafc) 70%, transparent); border-radius: 6px; overflow: hidden; }
    .bar { height: 100%; width: 0%; transition: width 0.2s ease; background: var(--color-error, #ef4444); }
    .bar.ok { background: #f59e0b; }
    .bar.good { background: #22c55e; }
    .bar.strong { background: #16a34a; }
    .error { color: var(--color-error, #ef4444); margin: 0; }
    .link { color: var(--color-primary, #1ea7ff); cursor: pointer; }
  `]
})
export class ResetPasswordComponent {
  loading = false;
  invalidToken = false;
  password = '';
  confirm = '';
  strength = 0;
  strengthLabel = 'Weak';
  error = '';
  private token: string;

  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router) {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.invalidToken = true;
    }
  }

  score() {
    const p = this.password || '';
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    this.strength = s;
    this.strengthLabel = ['Very weak','Weak','Fair','Good','Strong'][Math.min(s,4)];
  }

  submit() {
    if (this.loading) return;
    if (this.password !== this.confirm) {
      this.error = 'Passwords do not match';
      return;
    }
    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters';
      return;
    }
    this.error = '';
    this.loading = true;
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login'], { queryParams: { reset: 'success' } });
      },
      error: () => {
        this.loading = false;
        this.invalidToken = true;
      }
    });
  }

  toForgot() {
    this.router.navigate(['/auth/forgot']);
  }
}
