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
                <h1>{{ student()!.fullName }}</h1>
                <p class="admission-number">{{ student()!.enrollment.admissionNumber }}</p>
                <div class="meta-info">
                  <span class="badge" [class.badge-success]="student()!.status === 'active'" 
                        [class.badge-secondary]="student()!.status !== 'active'">
                    {{ student()!.status }}
                  </span>
                  <span class="meta-item">
                    <i class="icon-book"></i>
                    Class {{ student()!.enrollment.class }}{{ student()!.enrollment.section ? '-' + student()!.enrollment.section : '' }}
                  </span>
                  <span class="meta-item">
                    <i class="icon-calendar"></i>
                    Age {{ student()!.age }}
                  </span>
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
            <button class="tab-button" [class.active]="activeTab() === 'overview'" 
                    (click)="activeTab.set('overview')">
              Overview
            </button>
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
            <!-- Overview Tab -->
            @if (activeTab() === 'overview') {
              <div class="tab-pane">
                <div class="cards-grid">
                  <!-- Personal Information -->
                  <app-card>
                    <div class="card-header">
                      <h3 class="card-title">Personal Information</h3>
                    </div>
                    <div class="card-body">
                      <div class="info-grid">
                        <div class="info-item">
                          <label>Full Name</label>
                          <p>{{ student()!.fullName }}</p>
                        </div>
                        <div class="info-item">
                          <label>Date of Birth</label>
                          <p>{{ formatDate(student()!.dateOfBirth) }}</p>
                        </div>
                        <div class="info-item">
                          <label>Gender</label>
                          <p>{{ student()!.gender }}</p>
                        </div>
                        @if (student()!.nationality) {
                          <div class="info-item">
                            <label>Nationality</label>
                            <p>{{ student()!.nationality }}</p>
                          </div>
                        }
                        @if (student()!.email) {
                          <div class="info-item">
                            <label>Email</label>
                            <p>{{ student()!.email }}</p>
                          </div>
                        }
                        @if (student()!.phone) {
                          <div class="info-item">
                            <label>Phone</label>
                            <p>{{ student()!.phone }}</p>
                          </div>
                        }
                      </div>
                    </div>
                  </app-card>

                  <!-- Enrollment Information -->
                  <app-card>
                    <div class="card-header">
                      <h3 class="card-title">Enrollment Information</h3>
                    </div>
                    <div class="card-body">
                      <div class="info-grid">
                        <div class="info-item">
                          <label>Admission Number</label>
                          <p>{{ student()!.enrollment.admissionNumber }}</p>
                        </div>
                        <div class="info-item">
                          <label>Admission Date</label>
                          <p>{{ formatDate(student()!.enrollment.admissionDate) }}</p>
                        </div>
                        <div class="info-item">
                          <label>Academic Year</label>
                          <p>{{ student()!.enrollment.academicYear }}</p>
                        </div>
                        <div class="info-item">
                          <label>Class</label>
                          <p>{{ student()!.enrollment.class }}{{ student()!.enrollment.section ? '-' + student()!.enrollment.section : '' }}</p>
                        </div>
                        @if (student()!.enrollment.rollNumber) {
                          <div class="info-item">
                            <label>Roll Number</label>
                            <p>{{ student()!.enrollment.rollNumber }}</p>
                          </div>
                        }
                      </div>
                    </div>
                  </app-card>

                  <!-- Address -->
                  @if (student()!.address) {
                    <app-card>
                      <div class="card-header">
                        <h3 class="card-title">Address</h3>
                      </div>
                      <div class="card-body">
                        <p>{{ student()!.address!.street }}<br>
                        {{ student()!.address!.city }}, {{ student()!.address!.state }} {{ student()!.address!.postalCode }}<br>
                        {{ student()!.address!.country }}</p>
                      </div>
                    </app-card>
                  }
                </div>
              </div>
            }

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
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3b82f6;
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
      color: #64748b;
      margin-bottom: 1rem;
      
      a {
        color: #3b82f6;
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        color: #1e293b;
        margin: 0 0 0.5rem;
      }
      
      .admission-number {
        font-size: 0.875rem;
        color: #64748b;
        margin: 0 0 1rem;
      }
    }

    .meta-info {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #64748b;
      
      i {
        font-size: 1rem;
      }
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      
      &.badge-success {
        background: #dcfce7;
        color: #166534;
      }
      
      &.badge-secondary {
        background: #f1f5f9;
        color: #475569;
      }
      
      &.badge-primary {
        background: #dbeafe;
        color: #1e40af;
      }
      
      &.badge-warning {
        background: #fef3c7;
        color: #92400e;
      }
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .tabs-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .tabs-nav {
      display: flex;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 1.5rem;
      gap: 0.5rem;
    }

    .tab-button {
      padding: 1rem 1.5rem;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        color: #3b82f6;
        background: #f8fafc;
      }
      
      &.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
      }
    }

    .tab-content {
      padding: 2rem;
    }

    .cards-grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
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
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
      }

      p {
        font-size: 1rem;
        color: #1e293b;
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
      
      i {
        font-size: 2rem;
        color: #64748b;
      }
      
      .document-info {
        flex: 1;
        
        h4 {
          margin: 0 0 0.25rem;
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        p {
          margin: 0;
          font-size: 0.75rem;
          color: #64748b;
        }
        
        small {
          font-size: 0.75rem;
          color: #94a3b8;
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
      color: #64748b;
      
      i {
        font-size: 3rem;
        color: #cbd5e1;
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
          border-bottom: 1px solid #e2e8f0;
        }
      }
      
      .timeline-marker {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #3b82f6;
        margin-top: 0.25rem;
        flex-shrink: 0;
      }
      
      .timeline-content {
        flex: 1;
        
        .timeline-title {
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.25rem;
        }
        
        .timeline-date {
          font-size: 0.875rem;
          color: #64748b;
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
  activeTab = signal<'overview' | 'guardians' | 'medical' | 'documents' | 'history'>('overview');

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
