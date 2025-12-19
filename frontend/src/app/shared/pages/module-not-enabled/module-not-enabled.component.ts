/**
 * Module Not Enabled Component
 * 
 * Displayed when user attempts to access a module that's not included in their plan.
 * Provides upgrade guidance and navigation options.
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardComponent } from '../../components/card/card.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ModuleKey, MODULE_NAMES } from '../../types/module-keys';
import { EntitlementsService } from '../../services/entitlements.service';

@Component({
    selector: 'app-module-not-enabled',
    standalone: true,
    imports: [CommonModule, CardComponent, ButtonComponent],
    template: `
        <div class="module-not-enabled-container">
            <app-card>
                <div class="content">
                    <!-- Icon -->
                    <div class="icon-wrapper">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    </div>

                    <!-- Title & Description -->
                    <h1 class="title">Module Not Enabled</h1>
                    
                    <p class="description" *ngIf="moduleName()">
                        The <strong>{{ moduleName() }}</strong> module is not included in your current plan.
                    </p>
                    <p class="description" *ngIf="!moduleName()">
                        This module is not included in your current plan.
                    </p>

                    <!-- Plan Info -->
                    <div class="plan-info" *ngIf="currentPlan()">
                        <span class="plan-label">Current Plan:</span>
                        <span class="plan-badge">{{ currentPlan() | titlecase }}</span>
                    </div>

                    <!-- Contact Message -->
                    <p class="contact-message">
                        Contact your system administrator or account owner to upgrade your plan and access this feature.
                    </p>

                    <!-- Actions -->
                    <div class="actions">
                        <app-button 
                            variant="primary" 
                            (click)="goToDashboard()"
                            class="action-btn">
                            Back to Dashboard
                        </app-button>
                        
                        <app-button 
                            variant="secondary" 
                            (click)="goToSetup()"
                            *ngIf="canAccessSetup()"
                            class="action-btn">
                            View Plans
                        </app-button>
                    </div>

                    <!-- Return Link (if available) -->
                    <div class="return-link" *ngIf="returnUrl()">
                        <button type="button" class="link-button" (click)="goBack()">
                            ← Go back
                        </button>
                    </div>
                </div>
            </app-card>
        </div>
    `,
    styles: [`
        .module-not-enabled-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 60vh;
            padding: 2rem;
        }

        .content {
            text-align: center;
            max-width: 500px;
            padding: 2rem;
        }

        .icon-wrapper {
            display: flex;
            justify-content: center;
            margin-bottom: 1.5rem;
        }

        .icon {
            width: 4rem;
            height: 4rem;
            color: var(--color-warning, #f59e0b);
            opacity: 0.8;
        }

        .title {
            font-size: 1.75rem;
            font-weight: 600;
            color: var(--color-text-primary, #1f2937);
            margin: 0 0 1rem 0;
        }

        .description {
            font-size: 1rem;
            color: var(--color-text-secondary, #6b7280);
            margin: 0 0 1.5rem 0;
            line-height: 1.6;
        }

        .description strong {
            color: var(--color-text-primary, #1f2937);
            font-weight: 600;
        }

        .plan-info {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: var(--color-bg-secondary, #f9fafb);
            border-radius: 6px;
            margin-bottom: 1.5rem;
            font-size: 0.875rem;
        }

        .plan-label {
            color: var(--color-text-secondary, #6b7280);
        }

        .plan-badge {
            font-weight: 600;
            color: var(--color-primary, #3b82f6);
            text-transform: capitalize;
        }

        .contact-message {
            font-size: 0.875rem;
            color: var(--color-text-tertiary, #9ca3af);
            margin: 0 0 2rem 0;
            line-height: 1.5;
        }

        .actions {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
        }

        .action-btn {
            width: 100%;
        }

        .return-link {
            margin-top: 1rem;
        }

        .link-button {
            background: none;
            border: none;
            color: var(--color-primary, #3b82f6);
            font-size: 0.875rem;
            cursor: pointer;
            text-decoration: none;
            padding: 0.5rem;
            transition: opacity 0.2s;
        }

        .link-button:hover {
            opacity: 0.8;
            text-decoration: underline;
        }

        @media (min-width: 640px) {
            .actions {
                flex-direction: row;
                justify-content: center;
            }

            .action-btn {
                width: auto;
            }
        }
    `]
})
export class ModuleNotEnabledComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly entitlements = inject(EntitlementsService);

    // Signals for component state
    readonly moduleKey = signal<ModuleKey | null>(null);
    readonly moduleName = signal<string | null>(null);
    readonly returnUrl = signal<string | null>(null);
    readonly currentPlan = signal<string | null>(null);

    ngOnInit(): void {
        // Read query params
        this.route.queryParams.subscribe(params => {
            const moduleKey = params['module'] as ModuleKey;
            const returnUrl = params['returnUrl'];

            if (moduleKey) {
                this.moduleKey.set(moduleKey);
                this.moduleName.set(MODULE_NAMES[moduleKey] || moduleKey);
            }

            if (returnUrl) {
                this.returnUrl.set(returnUrl);
            }
        });

        // Get current plan
        const plan = this.entitlements.getCurrentPlan();
        if (plan) {
            this.currentPlan.set(plan);
        }
    }

    goToDashboard(): void {
        this.router.navigate(['/dashboard']);
    }

    goToSetup(): void {
        // Navigate to setup/plans page if it exists
        // TODO: Create a plans/pricing page in setup module
        this.router.navigate(['/setup']);
    }

    goBack(): void {
        const url = this.returnUrl();
        if (url) {
            this.router.navigateByUrl(url);
        } else {
            this.router.navigate(['/dashboard']);
        }
    }

    canAccessSetup(): boolean {
        // Check if user can access setup module
        return this.entitlements.isEnabled('setup');
    }
}
