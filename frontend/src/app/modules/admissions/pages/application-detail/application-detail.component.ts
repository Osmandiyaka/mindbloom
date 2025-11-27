import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdmissionsService, AdmissionApplication, AdmissionStatus, Score } from '../../services/admissions.service';

type TabType = 'overview' | 'documents' | 'scoring' | 'interview' | 'timeline';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.scss']
})
export class ApplicationDetailComponent implements OnInit {
  application = signal<AdmissionApplication | undefined>(undefined);
  activeTab = signal<TabType>('overview');
  editingScore = signal(false);
  
  // Scoring form
  scoreForm = {
    academic: 0,
    interview: 0,
    documents: 0,
    other: 0
  };
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private admissionsService: AdmissionsService
  ) {}
  
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const app = this.admissionsService.getApplicationById(id);
      if (app) {
        this.application.set(app);
        if (app.score) {
          this.scoreForm = { ...app.score.breakdown };
        }
      } else {
        this.router.navigate(['/admissions']);
      }
    }
  }
  
  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);
  }
  
  goBack(): void {
    this.router.navigate(['/admissions/pipeline']);
  }
  
  getStatusColor(status: AdmissionStatus): string {
    const colors: Record<AdmissionStatus, string> = {
      inquiry: '#9ca3af',
      application_submitted: '#3b82f6',
      under_review: '#f59e0b',
      interview_scheduled: '#8b5cf6',
      interview_completed: '#6366f1',
      accepted: '#10b981',
      waitlisted: '#f97316',
      rejected: '#dc2626',
      enrolled: '#14b8a6',
      withdrawn: '#6b7280'
    };
    return colors[status];
  }
  
  getStatusLabel(status: AdmissionStatus): string {
    const labels: Record<AdmissionStatus, string> = {
      inquiry: 'Inquiry',
      application_submitted: 'Application Submitted',
      under_review: 'Under Review',
      interview_scheduled: 'Interview Scheduled',
      interview_completed: 'Interview Completed',
      accepted: 'Accepted',
      waitlisted: 'Waitlisted',
      rejected: 'Rejected',
      enrolled: 'Enrolled',
      withdrawn: 'Withdrawn'
    };
    return labels[status];
  }
  
  getAge(): number {
    const app = this.application();
    if (!app) return 0;
    
    const today = new Date();
    const birthDate = new Date(app.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  
  toggleScoreEdit(): void {
    this.editingScore.set(!this.editingScore());
  }
  
  calculateTotalScore(): number {
    return this.scoreForm.academic + this.scoreForm.interview + 
           this.scoreForm.documents + this.scoreForm.other;
  }
  
  saveScore(): void {
    const app = this.application();
    if (!app) return;
    
    const score: Score = {
      total: this.calculateTotalScore(),
      breakdown: { ...this.scoreForm }
    };
    
    this.admissionsService.updateScore(app.id, score);
    
    // Reload application
    const updated = this.admissionsService.getApplicationById(app.id);
    if (updated) {
      this.application.set(updated);
    }
    
    this.editingScore.set(false);
  }
  
  cancelScoreEdit(): void {
    const app = this.application();
    if (app?.score) {
      this.scoreForm = { ...app.score.breakdown };
    }
    this.editingScore.set(false);
  }
  
  updateStatus(newStatus: AdmissionStatus): void {
    const app = this.application();
    if (!app) return;
    
    if (confirm(`Change status to ${this.getStatusLabel(newStatus)}?`)) {
      this.admissionsService.updateApplicationStatus(app.id, newStatus);
      const updated = this.admissionsService.getApplicationById(app.id);
      if (updated) {
        this.application.set(updated);
      }
    }
  }
  
  enrollStudent(): void {
    const app = this.application();
    if (!app) return;
    
    if (confirm('Are you sure you want to enroll this student? This will create their student account and assign fee plans.')) {
      this.admissionsService.enrollStudent(app.id);
      const updated = this.admissionsService.getApplicationById(app.id);
      if (updated) {
        this.application.set(updated);
      }
    }
  }
  
  canEnroll(): boolean {
    return this.application()?.status === 'accepted';
  }
  
  getScoreClass(score: number): string {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'average';
    return 'low';
  }
  
  getTimeInStatus(): string {
    const app = this.application();
    if (!app) return '';
    
    const lastStatus = app.statusHistory[app.statusHistory.length - 1];
    const statusDate = new Date(lastStatus.changedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - statusDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day';
    if (diffDays < 7) return `${diffDays} days`;
    const weeks = Math.floor(diffDays / 7);
    if (weeks === 1) return '1 week';
    if (weeks < 4) return `${weeks} weeks`;
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month' : `${months} months`;
  }
}
