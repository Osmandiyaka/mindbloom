import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonComponent, CardComponent],
    template: `
    <div class="login-page">
      <div class="login-container">
        <div class="login-header">
          <h1>🎓 MindBloom</h1>
          <p>School Management System</p>
        </div>

        <app-card>
          <div class="card-body">
            <h2 class="mb-4">Sign In</h2>
            <form (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label for="email">Email</label>
                <input
                  type="email"
                  id="email"
                  class="form-control"
                  [(ngModel)]="credentials.email"
                  name="email"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div class="form-group">
                <label for="password">Password</label>
                <input
                  type="password"
                  id="password"
                  class="form-control"
                  [(ngModel)]="credentials.password"
                  name="password"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div class="form-check mb-4">
                <input type="checkbox" id="remember" [(ngModel)]="rememberMe" name="remember" />
                <label for="remember">Remember me</label>
              </div>

              <app-button
                variant="primary"
                [block]="true"
                type="submit"
                [disabled]="loading">
                {{ loading ? 'Signing in...' : 'Sign In' }}
              </app-button>

              <div class="error-message" *ngIf="error">
                {{ error }}
              </div>
            </form>
          </div>
        </app-card>
      </div>
    </div>
  `,
    styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .login-container {
      width: 100%;
      max-width: 420px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
      color: white;

      h1 {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
      }

      p {
        font-size: 1.125rem;
        opacity: 0.9;
      }
    }

    .error-message {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #fee2e2;
      color: #dc2626;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }
  `]
})
export class LoginComponent {
    credentials = {
        email: '',
        password: ''
    };
    rememberMe = false;
    loading = false;
    error = '';

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    onSubmit(): void {
        this.loading = true;
        this.error = '';

        this.authService.login(this.credentials.email, this.credentials.password)
            .subscribe({
                next: () => {
                    this.router.navigate(['/dashboard']);
                },
                error: (err) => {
                    this.error = err.error?.message || 'Invalid credentials';
                    this.loading = false;
                }
            });
    }
}
