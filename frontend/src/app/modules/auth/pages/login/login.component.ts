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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
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
          const session = this.authService.session();
          if (session?.mode === 'host') {
            this.router.navigate(['/host']);
            return;
          }
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.error = err.error?.message || 'Invalid credentials';
          this.loading = false;
        }
      });
  }
}
