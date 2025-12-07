import { CommonModule } from '@angular/common';
import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdmissionsApiService, Application } from '../../services/admissions-api.service';

@Component({
  selector: 'app-application-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './application-status.component.html',
  styleUrls: ['./application-status.component.scss']
})
export class ApplicationStatusComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private admissionsApi = inject(AdmissionsApiService);

  applicationNumber = '';
  application = signal<Application | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.applicationNumber = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.applicationNumber) {
      this.loadApplication();
    }
  }

  async loadApplication() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const app = await this.admissionsApi
        .getApplicationByNumber(this.applicationNumber)
        .toPromise();
      
      this.application.set(app || null);
    } catch (err: any) {
      this.error.set(
        err.status === 404
          ? 'Application not found. Please check your application number.'
          : 'Failed to load application. Please try again.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      inquiry: 'status-inquiry',
      submitted: 'status-submitted',
      under_review: 'status-review',
      accepted: 'status-accepted',
      rejected: 'status-rejected',
      waitlisted: 'status-waitlisted',
      enrolled: 'status-enrolled',
      withdrawn: 'status-withdrawn'
    };
    return colors[status] || 'status-default';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      inquiry: 'Inquiry',
      submitted: 'Submitted',
      under_review: 'Under Review',
      accepted: 'Accepted',
      rejected: 'Rejected',
      waitlisted: 'Waitlisted',
      enrolled: 'Enrolled',
      withdrawn: 'Withdrawn'
    };
    return labels[status] || status;
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      inquiry: '📝',
      submitted: '📤',
      under_review: '🔍',
      accepted: '✅',
      rejected: '❌',
      waitlisted: '⏳',
      enrolled: '🎓',
      withdrawn: '🚫'
    };
    return icons[status] || '📄';
  }

  getNextSteps(status: string): string[] {
    const steps: Record<string, string[]> = {
      inquiry: [
        'Complete your application form',
        'Submit all required documents',
        'Wait for confirmation email'
      ],
      submitted: [
        'Your application is being processed',
        'You will be notified when it moves to review',
        'Estimated time: 2-3 business days'
      ],
      under_review: [
        'Our admissions team is reviewing your application',
        'You may be contacted for additional information',
        'Estimated time: 5-7 business days'
      ],
      accepted: [
        'Congratulations! Your application has been accepted',
        'Check your email for enrollment instructions',
        'Complete enrollment process within 14 days'
      ],
      rejected: [
        'Unfortunately, your application was not accepted this time',
        'You may reapply in the next academic year',
        'Contact admissions office for feedback'
      ],
      waitlisted: [
        'You are on our waitlist',
        'You will be notified if a spot becomes available',
        'Keep your contact information updated'
      ],
      enrolled: [
        'Welcome! You are now enrolled',
        'Check your email for orientation details',
        'Complete all pre-enrollment requirements'
      ],
      withdrawn: [
        'Your application has been withdrawn',
        'You may submit a new application if needed'
      ]
    };
    return steps[status] || ['Please contact admissions office for more information'];
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  navigateToNewApplication() {
    this.router.navigate(['/apply/application/new']);
  }
}
