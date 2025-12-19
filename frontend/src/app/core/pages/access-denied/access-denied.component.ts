import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

/**
 * Access Denied Page
 * 
 * Displayed when user attempts to access a route they don't have permission for.
 * Provides navigation back to safe areas of the application.
 */
@Component({
    selector: 'app-access-denied',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="access-denied-container">
            <div class="access-denied-card">
                <div class="icon-wrapper">
                    <svg class="lock-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>

                <h1 class="title">Access Denied</h1>
                
                <p class="subtitle">
                    You don't have permission to view this page.
                </p>

                @if (attemptedUrl) {
                    <p class="attempted-url">
                        Attempted to access: <code>{{ attemptedUrl }}</code>
                    </p>
                }

                <div class="actions">
                    <button class="btn btn-primary" (click)="goToDashboard()">
                        <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Go to Dashboard
                    </button>

                    <button class="btn btn-secondary" (click)="goBack()">
                        <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Go Back
                    </button>
                </div>

                <div class="help-text">
                    <p>If you believe you should have access to this page, please contact your administrator.</p>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .access-denied-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: calc(100vh - 200px);
            padding: 2rem;
        }

        .access-denied-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            padding: 3rem;
            max-width: 600px;
            width: 100%;
            text-align: center;
        }

        .icon-wrapper {
            display: flex;
            justify-content: center;
            margin-bottom: 1.5rem;
        }

        .lock-icon {
            width: 80px;
            height: 80px;
            color: #ef4444;
        }

        .title {
            font-size: 2rem;
            font-weight: 700;
            color: #1f2937;
            margin: 0 0 1rem 0;
        }

        .subtitle {
            font-size: 1.125rem;
            color: #6b7280;
            margin: 0 0 1.5rem 0;
        }

        .attempted-url {
            background: #f3f4f6;
            border-radius: 6px;
            padding: 0.75rem 1rem;
            margin-bottom: 2rem;
            font-size: 0.875rem;
            color: #4b5563;
        }

        .attempted-url code {
            background: white;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.813rem;
            color: #dc2626;
        }

        .actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-bottom: 2rem;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 500;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-icon {
            width: 20px;
            height: 20px;
        }

        .btn-primary {
            background: #3b82f6;
            color: white;
        }

        .btn-primary:hover {
            background: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }

        .btn-secondary {
            background: #f3f4f6;
            color: #4b5563;
        }

        .btn-secondary:hover {
            background: #e5e7eb;
            transform: translateY(-1px);
        }

        .help-text {
            padding-top: 1.5rem;
            border-top: 1px solid #e5e7eb;
        }

        .help-text p {
            font-size: 0.875rem;
            color: #9ca3af;
            margin: 0;
        }

        @media (max-width: 640px) {
            .access-denied-card {
                padding: 2rem 1.5rem;
            }

            .actions {
                flex-direction: column;
            }

            .btn {
                width: 100%;
                justify-content: center;
            }
        }
    `]
})
export class AccessDeniedComponent implements OnInit {
    attemptedUrl: string | null = null;

    constructor(
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        // Get the URL the user attempted to access
        this.route.queryParams.subscribe(params => {
            this.attemptedUrl = params['from'] || null;
        });
    }

    goToDashboard() {
        this.router.navigate(['/dashboard']);
    }

    goBack() {
        window.history.back();
    }
}
