import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { AdmissionsService, AdmissionApplication, AdmissionStatus } from '../../services/admissions.service';
import { ApplicationCardComponent } from '../../components/application-card/application-card.component';

interface PipelineColumn {
  id: AdmissionStatus;
  title: string;
  color: string;
  applications: AdmissionApplication[];
}

@Component({
  selector: 'app-admissions-pipeline',
  standalone: true,
  imports: [CommonModule, DragDropModule, ApplicationCardComponent],
  templateUrl: './admissions-pipeline.component.html',
  styleUrls: ['./admissions-pipeline.component.scss']
})
export class AdmissionsPipelineComponent implements OnInit {
  columns = signal<PipelineColumn[]>([]);
  
  private statusOrder: AdmissionStatus[] = [
    'inquiry',
    'application_submitted',
    'under_review',
    'interview_scheduled',
    'interview_completed',
    'accepted',
    'waitlisted',
    'enrolled'
  ];
  
  constructor(
    private admissionsService: AdmissionsService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadPipeline();
  }
  
  loadPipeline(): void {
    const columnConfigs: Array<{
      id: AdmissionStatus;
      title: string;
      color: string;
    }> = [
      { id: 'inquiry', title: 'Inquiry', color: '#9ca3af' },
      { id: 'application_submitted', title: 'Application', color: '#3b82f6' },
      { id: 'under_review', title: 'Under Review', color: '#f59e0b' },
      { id: 'interview_scheduled', title: 'Interview Scheduled', color: '#8b5cf6' },
      { id: 'interview_completed', title: 'Interview Done', color: '#6366f1' },
      { id: 'accepted', title: 'Accepted', color: '#10b981' },
      { id: 'waitlisted', title: 'Waitlisted', color: '#f97316' },
      { id: 'enrolled', title: 'Enrolled', color: '#14b8a6' }
    ];
    
    const cols: PipelineColumn[] = columnConfigs.map(config => ({
      ...config,
      applications: this.admissionsService.getApplicationsByStatus(config.id)
    }));
    
    this.columns.set(cols);
  }
  
  drop(event: CdkDragDrop<AdmissionApplication[]>, targetStatus: AdmissionStatus): void {
    if (event.previousContainer === event.container) {
      // Reordering within same column
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // Moving to different column
      const application = event.previousContainer.data[event.previousIndex];
      
      // Update application status
      this.admissionsService.updateApplicationStatus(
        application.id,
        targetStatus,
        `Moved from ${application.status} to ${targetStatus} via pipeline`
      );
      
      // Transfer item between arrays
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Reload to get updated data
      this.loadPipeline();
    }
  }
  
  onCardClick(applicationId: string): void {
    this.router.navigate(['/admissions', applicationId]);
  }
  
  onEnrollClick(applicationId: string): void {
    if (confirm('Are you sure you want to enroll this student? This will create their student account and assign fee plans.')) {
      this.admissionsService.enrollStudent(applicationId);
      this.loadPipeline();
    }
  }
  
  getColumnIds(): string[] {
    return this.columns().map(col => col.id);
  }
  
  getTotalApplications(): number {
    return this.admissionsService.applications().length;
  }
  
  getColumnCount(status: AdmissionStatus): number {
    return this.admissionsService.getApplicationsByStatus(status).length;
  }
  
  getColumnPercentage(count: number): number {
    const total = this.getTotalApplications();
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }
}
