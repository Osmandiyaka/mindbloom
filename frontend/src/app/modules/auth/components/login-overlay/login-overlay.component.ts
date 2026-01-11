import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TenantPostLoginRouter } from '../../../../core/tenant/tenant-post-login-router.service';
import { TenantRegistrationComponent } from '../tenant-registration/tenant-registration.component';
import { sanitizeReturnUrl } from '../../../../core/auth/return-url.util';
import {
    MbAlertComponent,
    MbButtonComponent,
    MbCheckboxComponent,
    MbCardComponent,
    MbFormFieldComponent,
    MbInputComponent
} from '@mindbloom/ui';

@Component({
    selector: 'app-login-overlay',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TenantRegistrationComponent,
        MbFormFieldComponent,
        MbInputComponent,
        MbCheckboxComponent,
        MbButtonComponent,
        MbCardComponent,
        MbAlertComponent
    ],
    templateUrl: './login-overlay.component.html',
    styleUrls: ['./login-overlay.component.scss']
})
export class LoginOverlayComponent {
    @ViewChild('alertRef') alertRef?: ElementRef<HTMLDivElement>;

    username = signal('');
    password = signal('');
    showPassword = signal(false);
    rememberMe = signal(false);
    capsLockOn = signal(false);
    isLoading = signal(false);
    errorMessage = signal('');
    resetSuccess = signal(false);

    showRegistration = signal(false);
    private readonly defaultReturnUrl = '/dashboard';
    private targetAfterLogin = this.defaultReturnUrl;

    constructor(
        private authService: AuthService,
        private tenantPostLoginRouter: TenantPostLoginRouter,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.route.queryParamMap.subscribe(params => {
            this.resetSuccess.set(params.get('reset') === 'success');
            this.targetAfterLogin = sanitizeReturnUrl(
                this.router,
                params.get('returnUrl'),
                this.defaultReturnUrl
            );
        });

    }

    onRegisterTenant(event: Event): void {
        event.preventDefault();
        this.showRegistration.set(true);
    }

    onRegistrationCancelled(): void {
        this.showRegistration.set(false);
    }

    onRegistrationCompleted(_data: { tenantId: string; subdomain: string }): void {
        this.showRegistration.set(false);
        this.errorMessage.set('');
    }

    togglePassword(): void {
        this.showPassword.update(v => !v);
    }

    handleCapsLock(event: KeyboardEvent): void {
        this.capsLockOn.set(event.getModifierState?.('CapsLock') ?? false);
    }

    onSubmit(): void {
        if (!this.username().trim() || !this.password()) {
            this.errorMessage.set('We couldn’t sign you in. Check your details and try again.');
            this.focusAlert();
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        this.authService.login(this.username(), this.password()).subscribe({
            next: async () => {
                this.isLoading.set(false);

                const session = this.authService.session();
                if (session?.mode === 'host') {
                    await this.router.navigateByUrl('/host');
                    return;
                }

                if (session?.memberships) {
                    await this.tenantPostLoginRouter.route(session.memberships, this.targetAfterLogin);
                } else {
                    this.router.navigateByUrl(this.targetAfterLogin);
                }
            },
            error: (error) => {
                this.isLoading.set(false);
                this.errorMessage.set(error?.error?.message || 'We couldn’t sign you in. Check your details and try again.');
                this.focusAlert();
            }
        });
    }

    private focusAlert(): void {
        setTimeout(() => this.alertRef?.nativeElement?.focus(), 0);
    }

}
