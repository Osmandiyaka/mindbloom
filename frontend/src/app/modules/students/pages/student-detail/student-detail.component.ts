import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { StudentService } from '../../../../core/services/student.service';
import { Student } from '../../../../core/models/student.model';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, ButtonComponent, BadgeComponent],
  template: `
    <div class="student-detail-page">
      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading student details...</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <app-button variant="primary" (click)="loadStudent()">Retry</app-button>
        </div>
      }

      <!-- Student Details -->
      @if (!loading() && !error() && student()) {
      <div class="student-content">
        <!-- Header Section -->
        <div class="page-header">
          <div class="header-left">
            <div class="breadcrumb">
              <a [routerLink]="['/students']">Students</a>
              <span class="separator">/</span>
              <span>{{ student()!.fullName }}</span>
            </div>
            <div class="student-header">
              <div class="student-avatar">
                @if (student()!.photo) {
                  <img [src]="student()!.photo" [alt]="student()!.fullName" />
                } @else {
                  <div class="avatar-placeholder">
                    {{ student()!.firstName.charAt(0) }}{{ student()!.lastName.charAt(0) }}
                  </div>
                }
              </div>
              <div class="student-info">
                <div class="student-name-row">
                  <h1>{{ student()!.fullName }}</h1>
                  <span class="badge" [class.badge-success]="student()!.status === 'active'" 
                        [class.badge-secondary]="student()!.status !== 'active'">
                    {{ student()!.status }}
                  </span>
                </div>
                <div class="meta-info">
                  <span class="meta-item">
                    <div class="meta-label">
                      <i class="icon-hash"></i>
                      Admission #
                    </div>
                    <div class="meta-value">
                      {{ student()!.enrollment.admissionNumber }}
                    </div>
                  </span>
                  <span class="meta-item">
                    <div class="meta-label">
                      <i class="icon-calendar"></i>
                      Admission date
                    </div>
                    <div class="meta-value">
                      {{ formatDate(student()!.enrollment.admissionDate) }}
                    </div>
                  </span>
                  <span class="meta-item">
                    <div class="meta-label">
                      <i class="icon-book"></i>
                      Class
                    </div>
                    <div class="meta-value">
                      {{ student()!.enrollment.class }}{{ student()!.enrollment.section ? '-' + student()!.enrollment.section : '' }}
                    </div>
                  </span>
                  <span class="meta-item">
                    <div class="meta-label">
                      <i class="icon-gift"></i>
                      Date of birth
                    </div>
                    <div class="meta-value">
                      {{ formatDate(student()!.dateOfBirth) }}
                    </div>
                  </span>
                  @if (student()!.email) {
                    <span class="meta-item">
                      <div class="meta-label">
                        <i class="icon-mail"></i>
                        Email
                      </div>
                      <div class="meta-value">
                        {{ student()!.email }}
                      </div>
                    </span>
                  }
                  @if (student()!.phone) {
                    <span class="meta-item">
                      <div class="meta-label">
                        <i class="icon-phone"></i>
                        Phone
                      </div>
                      <div class="meta-value">
                        {{ student()!.phone }}
                      </div>
                    </span>
                  }
                  @if (student()!.nationality) {
                    <span class="meta-item">
                      <div class="meta-label">
                        <i class="icon-globe"></i>
                        Nationality
                      </div>
                      <div class="meta-value">
                        {{ student()!.nationality }}
                      </div>
                    </span>
                  }
                  @if (student()!.address) {
                    <span class="meta-item">
                      <div class="meta-label">
                        <i class="icon-map-pin"></i>
                        Address
                      </div>
                      <div class="meta-value">
                        {{ student()!.address!.street }}<br>
                        {{ student()!.address!.city }}, {{ student()!.address!.state }} {{ student()!.address!.postalCode }}<br>
                        {{ student()!.address!.country }}
                      </div>
                    </span>
                  }
                </div>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <app-button variant="secondary" (click)="editStudent()">
              <i class="icon-edit"></i> Edit
            </app-button>
            <app-button variant="danger" (click)="deleteStudent()">
              <i class="icon-trash"></i> Delete
            </app-button>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="tabs-container">
          <div class="tabs-nav">
            <button class="tab-button" [class.active]="activeTab() === 'guardians'" 
                    (click)="activeTab.set('guardians')">
              Guardians
            </button>
            <button class="tab-button" [class.active]="activeTab() === 'medical'" 
                    (click)="activeTab.set('medical')">
              Medical Info
            </button>
            <button class="tab-button" [class.active]="activeTab() === 'documents'" 
                    (click)="activeTab.set('documents')">
              Documents
            </button>
            <button class="tab-button" [class.active]="activeTab() === 'history'" 
                    (click)="activeTab.set('history')">
              History
            </button>
          </div>

          <!-- Tab Content -->
          <div class="tab-content">
            <!-- Guardians Tab -->
            @if (activeTab() === 'guardians') {
              <div class="tab-pane">
                <div class="guardians-section">
                  @for (guardian of student()!.guardians; track guardian.id) {
                    <app-card>
                      <div class="card-header">
                        <h3 class="card-title">{{ guardian.name }}</h3>
                        @if (guardian.isPrimary) {
                          <span class="badge badge-primary">Primary</span>
                        }
                        @if (guardian.isEmergencyContact) {
                          <span class="badge badge-warning">Emergency Contact</span>
                        }
                      </div>
                      <div class="card-body">
                        <div class="info-grid">
                          <div class="info-item">
                            <label>Relationship</label>
                            <p>{{ guardian.relationship }}</p>
                          </div>
                          <div class="info-item">
                            <label>Phone</label>
                            <p>{{ guardian.phone }}</p>
                          </div>
                          @if (guardian.email) {
                            <div class="info-item">
                              <label>Email</label>
                              <p>{{ guardian.email }}</p>
                            </div>
                          }
                          @if (guardian.occupation) {
                            <div class="info-item">
                              <label>Occupation</label>
                              <p>{{ guardian.occupation }}</p>
                            </div>
                          }
                        </div>
                        @if (guardian.address) {
                          <div class="mt-3">
                            <label>Address</label>
                            <p>{{ guardian.address.street }}, {{ guardian.address.city }}, {{ guardian.address.state }}</p>
                          </div>
                        }
                      </div>
                    </app-card>
                  }
                </div>
              </div>
            }

            <!-- Medical Info Tab -->
            @if (activeTab() === 'medical') {
              <div class="tab-pane">
                @if (student()!.medicalInfo) {
                  <app-card>
                    <div class="card-header">
                      <h3 class="card-title">Medical Information</h3>
                    </div>
                    <div class="card-body">
                      <div class="info-grid">
                        @if (student()!.medicalInfo!.bloodGroup) {
                          <div class="info-item">
                            <label>Blood Group</label>
                            <p>{{ student()!.medicalInfo!.bloodGroup }}</p>
                          </div>
                        }
                        @if (student()!.medicalInfo!.allergies && student()!.medicalInfo!.allergies!.length > 0) {
                          <div class="info-item">
                            <label>Allergies</label>
                            <p>{{ student()!.medicalInfo!.allergies!.join(', ') }}</p>
                          </div>
                        }
                        @if (student()!.medicalInfo!.medicalConditions && student()!.medicalInfo!.medicalConditions!.length > 0) {
                          <div class="info-item">
                            <label>Medical Conditions</label>
                            <p>{{ student()!.medicalInfo!.medicalConditions!.join(', ') }}</p>
                          </div>
                        }
                        @if (student()!.medicalInfo!.medications && student()!.medicalInfo!.medications!.length > 0) {
                          <div class="info-item">
                            <label>Medications</label>
                            <p>{{ student()!.medicalInfo!.medications!.join(', ') }}</p>
                          </div>
                        }
                        @if (student()!.medicalInfo!.doctorName) {
                          <div class="info-item">
                            <label>Doctor Name</label>
                            <p>{{ student()!.medicalInfo!.doctorName }}</p>
                          </div>
                        }
                        @if (student()!.medicalInfo!.doctorPhone) {
                          <div class="info-item">
                            <label>Doctor Phone</label>
                            <p>{{ student()!.medicalInfo!.doctorPhone }}</p>
                          </div>
                        }
                      </div>
                    </div>
                  </app-card>
                } @else {
                  <div class="empty-state">
                    <p>No medical information available</p>
                  </div>
                }
              </div>
            }

            <!-- Documents Tab -->
            @if (activeTab() === 'documents') {
              <div class="tab-pane">
                @if (student()!.documents && student()!.documents!.length > 0) {
                  <div class="documents-grid">
                    @for (doc of student()!.documents; track doc.id) {
                      <app-card>
                        <div class="document-item">
                          <i class="icon-file"></i>
                          <div class="document-info">
                            <h4>{{ doc.name }}</h4>
                            <p>{{ doc.type }}</p>
                            <small>Uploaded: {{ formatDate(doc.uploadedAt) }}</small>
                          </div>
                          <a [href]="doc.url" target="_blank" class="btn btn-sm">View</a>
                        </div>
                      </app-card>
                    }
                  </div>
                } @else {
                  <div class="empty-state">
                    <i class="icon-folder"></i>
                    <p>No documents uploaded</p>
                    <app-button variant="primary">Upload Document</app-button>
                  </div>
                }
              </div>
            }

            <!-- History Tab -->
            @if (activeTab() === 'history') {
              <div class="tab-pane">
                <app-card>
                  <div class="card-header">
                    <h3 class="card-title">Activity History</h3>
                  </div>
                  <div class="card-body">
                    <div class="timeline">
                      <div class="timeline-item">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                          <p class="timeline-title">Student Enrolled</p>
                          <p class="timeline-date">{{ formatDate(student()!.createdAt) }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </app-card>
              </div>
            }
          </div>
        </div>
      </div>
      }
    </div>
  `,
  styles: [`
    .student-detail-page {
      padding: 1.5rem 2rem;
      max-width: 1400px;
      margin: 0 auto;
      background: var(--color-surface);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--color-surface-hover);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      color: var(--color-text-primary);
    }

    .spinner {
      border: 3px solid var(--color-border);
      border-top: 3px solid var(--color-primary);
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      gap: 2rem;
    }

    .breadcrumb {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin-bottom: 1rem;
      
      a {
        color: var(--color-primary);
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
      
      .separator {
        margin: 0 0.5rem;
      }
    }

    .student-header {
      display: flex;
      gap: 1.5rem;
      align-items: flex-start;
      background: var(--color-surface-hover);
      border: 1px solid var(--color-border);
      padding: 1rem;
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
    }

    .student-avatar {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      overflow: hidden;
      flex-shrink: 0;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, var(--color-primary)));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 2rem;
      font-weight: 600;
    }

    .student-info {
      h1 {
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-text-primary);
        margin: 0 0 0.5rem;
      }
      
      .admission-number {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
        margin: 0 0 1rem;
      }
    }

    .meta-info {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 200px;
      padding: 0.35rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: 10px;
      background: var(--color-surface-hover);
      box-shadow: var(--shadow-xs, var(--shadow-sm));
    }

    .meta-label {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-text-secondary);
      font-weight: 600;
    }

    .meta-label i {
      font-size: 1rem;
    }

    .meta-value {
      font-size: 0.95rem;
      color: var(--color-text-primary);
      font-weight: 600;
      line-height: 1.35;
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      
      &.badge-success {
        background: color-mix(in srgb, var(--color-success) 15%, transparent);
        color: var(--color-success);
      }
      
      &.badge-secondary {
        background: var(--color-surface-hover);
        color: var(--color-text-secondary);
      }
      
      &.badge-primary {
        background: color-mix(in srgb, var(--color-primary) 18%, transparent);
        color: color-mix(in srgb, var(--color-primary) 80%, #0f172a 20%);
      }
      
      &.badge-warning {
        background: color-mix(in srgb, var(--color-warning) 18%, transparent);
        color: var(--color-warning);
      }
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .tabs-container {
      background: var(--color-surface);
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      border: 1px solid var(--color-border);
    }

    .tabs-nav {
      display: flex;
      border-bottom: 1px solid var(--color-border);
      padding: 0 1.5rem;
      gap: 0.5rem;
    }

    .tab-button {
      padding: 1rem 1.5rem;
      background: var(--color-surface);
      border: 1px solid transparent;
      border-bottom: 2px solid transparent;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        color: var(--color-primary);
        background: var(--color-surface-hover);
      }
      
      &.active {
        color: var(--color-primary);
        border-bottom-color: var(--color-primary);
      }
    }

    .tab-content {
      padding: 2rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
    }

    /* Force card surfaces to use theme vars (override global dark-soft glass) */
    :host ::ng-deep [data-theme] app-card,
    :host ::ng-deep [data-theme] app-card .card {
      background: var(--color-surface) !important;
      border: 1px solid var(--color-border) !important;
      border-radius: 12px !important;
      box-shadow: var(--shadow-sm) !important;
      color: var(--color-text-primary) !important;
      backdrop-filter: none !important;
    }

    :host ::ng-deep [data-theme] app-card .card-header {
      border-bottom: 1px solid var(--color-border) !important;
      background: transparent !important;
    }

    .card-title {
      color: var(--color-text-primary);
    }

    .cards-grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    }

    .info-grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    .info-item {
      label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
      }

      p {
        font-size: 1rem;
        color: var(--color-text-primary);
        margin: 0;
      }
    }

    .guardians-section {
      display: grid;
      gap: 1.5rem;
    }

    .documents-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }

    .document-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--color-surface-hover);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      box-shadow: var(--shadow-sm);
      
      i {
        font-size: 2rem;
        color: var(--color-primary);
      }
      
      .document-info {
        flex: 1;
        
        h4 {
          margin: 0 0 0.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-primary);
        }
        
        p {
          margin: 0;
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }
        
        small {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
      color: var(--color-text-secondary);
      background: var(--color-surface-hover);
      border: 1px dashed var(--color-border);
      border-radius: 12px;
      
      i {
        font-size: 3rem;
        color: var(--color-primary);
        margin-bottom: 1rem;
      }
      
      p {
        margin: 0 0 1rem;
      }
    }

    .timeline {
      .timeline-item {
        display: flex;
        gap: 1rem;
        padding: 1rem 0;
        
        &:not(:last-child) {
          border-bottom: 1px solid var(--color-border);
        }
      }
      
      .timeline-marker {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--color-primary);
        margin-top: 0.25rem;
        flex-shrink: 0;
      }
      
      .timeline-content {
        flex: 1;
        
        .timeline-title {
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 0.25rem;
        }
        
        .timeline-date {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin: 0;
        }
      }
    }

    .mt-3 {
      margin-top: 1rem;
    }
  `]
})
export class StudentDetailComponent implements OnInit {
  studentId = signal<string | null>(null);
  student = signal<Student | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<'guardians' | 'medical' | 'documents' | 'history'>('guardians');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.studentId.set(id);
      this.loadStudent();
    }
  }

  loadStudent(): void {
    const id = this.studentId();
    if (!id) return;

    this.loading.set(true);
    this.error.set(null);

    this.studentService.getStudent(id).subscribe({
      next: (student) => {
        this.student.set(student);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading student:', err);
        this.error.set('Failed to load student details');
        this.loading.set(false);
      }
    });
  }

  editStudent(): void {
    const id = this.studentId();
    if (id) {
      this.router.navigate(['/students', id, 'edit']);
    }
  }

  deleteStudent(): void {
    const student = this.student();
    if (!student) return;

    if (confirm(`Are you sure you want to delete ${student.fullName}?`)) {
      this.studentService.deleteStudent(student.id).subscribe({
        next: () => {
          this.router.navigate(['/students']);
        },
        error: (err) => {
          alert('Failed to delete student');
          console.error('Error deleting student:', err);
        }
      });
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
