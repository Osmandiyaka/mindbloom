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
                  <div class="name-and-status">
                    <h1>{{ student()!.fullName }}</h1>
                    <span class="badge" [class.badge-success]="student()!.status === 'active'" 
                          [class.badge-secondary]="student()!.status !== 'active'">
                      {{ student()!.status }}
                    </span>
                  </div>
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
                    <div class="meta-value editable">
                      @if (editingField() === 'dateOfBirth') {
                        <div class="inline-edit">
                          <input type="date" [value]="tempDob()" (input)="onDobInput($event)" />
                          <div class="inline-actions">
                            <button type="button" class="inline-btn" (click)="saveField('dateOfBirth')">Save</button>
                            <button type="button" class="inline-btn ghost" (click)="cancelEdit()">Cancel</button>
                          </div>
                        </div>
                      } @else {
                        <span>{{ formatDate(student()!.dateOfBirth) }}</span>
                        <button type="button" class="chip-edit" (click)="startEdit('dateOfBirth')" aria-label="Edit date of birth">
                          ✏️
                        </button>
                      }
                    </div>
                  </span>
                  @if (student()!.email) {
                    <span class="meta-item">
                      <div class="meta-label">
                        <i class="icon-mail"></i>
                        Email
                      </div>
                      <div class="meta-value editable">
                        @if (editingField() === 'email') {
                          <div class="inline-edit">
                            <input type="email" [value]="tempEmail()" (input)="onEmailInput($event)" />
                            <div class="inline-actions">
                              <button type="button" class="inline-btn" (click)="saveField('email')">Save</button>
                              <button type="button" class="inline-btn ghost" (click)="cancelEdit()">Cancel</button>
                            </div>
                          </div>
                        } @else {
                          <span>{{ student()!.email }}</span>
                          <button type="button" class="chip-edit" (click)="startEdit('email')" aria-label="Edit email">
                            ✏️
                          </button>
                        }
                      </div>
                    </span>
                  }
                  @if (student()!.phone) {
                    <span class="meta-item">
                      <div class="meta-label">
                        <i class="icon-phone"></i>
                        Phone
                      </div>
                      <div class="meta-value editable">
                        @if (editingField() === 'phone') {
                          <div class="inline-edit">
                            <input type="text" [value]="tempPhone()" (input)="onPhoneInput($event)" />
                            <div class="inline-actions">
                              <button type="button" class="inline-btn" (click)="saveField('phone')">Save</button>
                              <button type="button" class="inline-btn ghost" (click)="cancelEdit()">Cancel</button>
                            </div>
                          </div>
                        } @else {
                          <span>{{ student()!.phone }}</span>
                          <button type="button" class="chip-edit" (click)="startEdit('phone')" aria-label="Edit phone">
                            ✏️
                          </button>
                        }
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
                      <div class="meta-value editable">
                        @if (editingField() === 'address') {
                          <div class="inline-edit address-grid">
                            <input type="text" placeholder="Street" [value]="tempAddress().street" (input)="onAddressInput('street', $event)" />
                            <input type="text" placeholder="City" [value]="tempAddress().city" (input)="onAddressInput('city', $event)" />
                            <input type="text" placeholder="State" [value]="tempAddress().state" (input)="onAddressInput('state', $event)" />
                            <input type="text" placeholder="Postal" [value]="tempAddress().postalCode" (input)="onAddressInput('postalCode', $event)" />
                            <input type="text" placeholder="Country" [value]="tempAddress().country" (input)="onAddressInput('country', $event)" />
                            <div class="inline-actions">
                              <button type="button" class="inline-btn" (click)="saveField('address')">Save</button>
                              <button type="button" class="inline-btn ghost" (click)="cancelEdit()">Cancel</button>
                            </div>
                          </div>
                        } @else {
                          <span>
                            {{ student()!.address!.street }}<br>
                            {{ student()!.address!.city }}, {{ student()!.address!.state }} {{ student()!.address!.postalCode }}<br>
                            {{ student()!.address!.country }}
                          </span>
                          <button type="button" class="chip-edit" (click)="startEdit('address')" aria-label="Edit address">
                            ✏️
                          </button>
                        }
                      </div>
                    </span>
                  }
                </div>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <app-button class="action-btn" variant="secondary" (click)="editStudent()">
              <svg class="action-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 17.25V20h2.75L17.81 8.94l-2.75-2.75L4 17.25Zm14.71-9.04a1 1 0 0 0 0-1.41l-2.51-2.51a1 1 0 0 0-1.41 0l-1.83 1.83 3.92 3.92 1.83-1.83Z"/>
              </svg>
              Edit
            </app-button>
            <app-button class="action-btn" variant="danger" (click)="deleteStudent()">
              <svg class="action-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 3h6a1 1 0 0 1 1 1v1h4v2H4V5h4V4a1 1 0 0 1 1-1Zm-1 7h2v8H8v-8Zm6 0h2v8h-2v-8Z"/>
              </svg>
              Delete
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
            <button class="tab-button" [class.active]="activeTab() === 'academic'" 
                    (click)="activeTab.set('academic')">
              Academic
            </button>
            <button class="tab-button" [class.active]="activeTab() === 'fees'" 
                    (click)="activeTab.set('fees')">
              Fees
            </button>
            <button class="tab-button" [class.active]="activeTab() === 'documents'" 
                    (click)="activeTab.set('documents')">
              Documents
            </button>
            <button class="tab-button" [class.active]="activeTab() === 'notes'" 
                    (click)="activeTab.set('notes')">
              Notes
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
                        <div class="guardian-meta">
                          <div class="meta-chip">
                            <span class="meta-label">Relationship</span>
                            <span class="meta-value">{{ guardian.relationship }}</span>
                          </div>
                          <div class="meta-chip">
                            <span class="meta-label">Phone</span>
                            <span class="meta-value">{{ guardian.phone }}</span>
                          </div>
                          @if (guardian.email) {
                            <div class="meta-chip">
                              <span class="meta-label">Email</span>
                              <span class="meta-value">{{ guardian.email }}</span>
                            </div>
                          }
                          @if (guardian.occupation) {
                            <div class="meta-chip">
                              <span class="meta-label">Occupation</span>
                              <span class="meta-value">{{ guardian.occupation }}</span>
                            </div>
                          }
                          @if (guardian.address) {
                            <div class="meta-chip wide-chip">
                              <span class="meta-label">Address</span>
                              <span class="meta-value">
                                {{ guardian.address.street }}<br>
                                {{ guardian.address.city }}, {{ guardian.address.state }} {{ guardian.address.postalCode }}
                              </span>
                            </div>
                          }
                        </div>
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

            <!-- Academic Tab -->
            @if (activeTab() === 'academic') {
              <div class="tab-pane">
                <app-card>
                  <div class="card-header">
                    <h3 class="card-title">Academic Info</h3>
                  </div>
                  <div class="card-body">
                    <div class="info-grid">
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
              </div>
            }

            <!-- Fees Tab -->
            @if (activeTab() === 'fees') {
              <div class="tab-pane">
                <app-card>
                  <div class="card-header">
                    <h3 class="card-title">Fees</h3>
                  </div>
                  <div class="card-body">
                    <div class="empty-state">
                      <p>No fee records available.</p>
                    </div>
                  </div>
                </app-card>
              </div>
            }

            <!-- Notes Tab -->
            @if (activeTab() === 'notes') {
              <div class="tab-pane notes-plain">
                <div class="notes-header">
                  <h3 class="card-title">Notes</h3>
                  <div class="note-actions">
                    <textarea
                      rows="2"
                      placeholder="Add a note..."
                      [value]="newNote()"
                      (input)="onNoteInput($event)"></textarea>
                    <button type="button" class="note-add" (click)="addNote()" [disabled]="!newNote().trim()">
                      <span class="note-icon">📝</span>
                      Add Note
                    </button>
                  </div>
                </div>
                @if (notesList().length) {
                  <ul class="note-list">
                    @for (note of notesList(); track $index) {
                      <li class="note-item">
                        <div class="note-text">{{ note }}</div>
                        <button type="button" class="note-delete" (click)="deleteNote($index)" aria-label="Delete note">
                          🗑️
                        </button>
                      </li>
                    }
                  </ul>
                } @else {
                  <div class="empty-state">
                    <p>No notes added.</p>
                  </div>
                }
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

    .name-and-status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
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

    .editable .chip-edit {
      margin-left: 0.5rem;
      padding: 0.1rem 0.5rem;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text-secondary);
      cursor: pointer;
    }

    .inline-edit {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .inline-edit input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      background: var(--color-surface);
      color: var(--color-text-primary);
    }

    .inline-actions {
      display: flex;
      gap: 0.5rem;
    }

    .inline-btn {
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      background: var(--color-primary, var(--color-surface-hover));
      color: var(--color-text-primary);
      cursor: pointer;
    }

    .inline-btn.ghost {
      background: var(--color-surface);
      color: var(--color-text-secondary);
    }

    .address-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.4rem 0.6rem;
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

    .action-icon {
      width: 1rem;
      height: 1rem;
      fill: currentColor;
      margin-right: 0.35rem;
      flex-shrink: 0;
    }

    /* Theme-aware action buttons */
    :host ::ng-deep .action-btn button {
      background: var(--color-surface-hover);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    :host ::ng-deep .action-btn button:hover {
      background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface-hover));
      border-color: color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
    }

    :host ::ng-deep .action-btn[variant="danger"] button {
      background: color-mix(in srgb, var(--color-danger, #e11d48) 16%, var(--color-surface-hover));
      color: var(--color-text-primary);
      border-color: color-mix(in srgb, var(--color-danger, #e11d48) 30%, var(--color-border));
    }

    :host ::ng-deep .action-btn[variant="danger"] button:hover {
      background: color-mix(in srgb, var(--color-danger, #e11d48) 28%, var(--color-surface-hover));
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
      gap: 1.25rem;
      grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
    }

    /* Guardians card header: lighter tone, no divider line */
    .guardians-section app-card .card-header {
      background: color-mix(in srgb, var(--color-surface) 85%, var(--color-primary) 10%);
      border-bottom: none;
      border-radius: 10px 10px 0 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.85rem 1rem;
    }

    .guardian-meta {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .meta-chip {
      display: inline-flex;
      flex-direction: column;
      gap: 0.2rem;
      min-width: 140px;
      padding: 0.35rem 0.65rem;
      border: 1px solid var(--color-border);
      border-radius: 10px;
      background: var(--color-surface-hover);
      box-shadow: var(--shadow-xs, var(--shadow-sm));
    }

    .meta-chip .meta-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-text-secondary);
      font-weight: 600;
    }

    .meta-chip .meta-value {
      font-size: 0.95rem;
      color: var(--color-text-primary);
      font-weight: 600;
      line-height: 1.3;
    }

    .wide-chip {
      min-width: 260px;
    }

    .documents-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }

    .note-actions {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      width: 100%;
    }

    .note-actions textarea {
      flex: 1;
      padding: 0.6rem 0.75rem;
      border-radius: 10px;
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text-primary);
      resize: vertical;
      min-height: 60px;
    }

    .note-add {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.55rem 0.9rem;
      border-radius: 10px;
      border: 1px solid var(--color-border);
      background: var(--color-primary);
      color: var(--color-on-primary, #0b1223);
      cursor: pointer;
      box-shadow: var(--shadow-sm);
    }

    .note-add:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .note-icon {
      font-size: 1rem;
    }

    .note-list {
      list-style: none;
      padding: 0;
      margin: 0.75rem 0 0;
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      border-top: none;
    }

    .notes-plain {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .notes-header {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .note-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0.9rem;
      border: 1px solid var(--color-border);
      border-radius: 10px;
      background: var(--color-surface-hover);
    }

    .note-text {
      color: var(--color-text-primary);
      white-space: pre-wrap;
      margin-right: 0.75rem;
      flex: 1;
    }

    .note-delete {
      border: 1px solid var(--color-border);
      background: color-mix(in srgb, var(--color-danger, #e11d48) 12%, var(--color-surface));
      color: var(--color-text-primary);
      border-radius: 8px;
      padding: 0.35rem 0.6rem;
      cursor: pointer;
      box-shadow: var(--shadow-xs, var(--shadow-sm));
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
  notesList = signal<string[]>([]);
  newNote = signal<string>('');
  loading = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<'guardians' | 'medical' | 'academic' | 'fees' | 'documents' | 'notes'>('guardians');
  editingField = signal<'dateOfBirth' | 'email' | 'phone' | 'address' | null>(null);
  tempEmail = signal<string>('');
  tempPhone = signal<string>('');
  tempDob = signal<string>('');
  tempAddress = signal({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });

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
        this.notesList.set(student.notes ? student.notes.split('\n').filter(n => n.trim().length) : []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading student:', err);
        this.error.set('Failed to load student details');
        this.loading.set(false);
      }
    });
  }

  startEdit(field: 'dateOfBirth' | 'email' | 'phone' | 'address'): void {
    const s = this.student();
    if (!s) return;

    if (field === 'email') this.tempEmail.set(s.email || '');
    if (field === 'phone') this.tempPhone.set(s.phone || '');
    if (field === 'dateOfBirth') this.tempDob.set(this.toInputDate(s.dateOfBirth));
    if (field === 'address') {
      this.tempAddress.set({
        street: s.address?.street || '',
        city: s.address?.city || '',
        state: s.address?.state || '',
        postalCode: s.address?.postalCode || '',
        country: s.address?.country || ''
      });
    }

    this.editingField.set(field);
  }

  cancelEdit(): void {
    this.editingField.set(null);
  }

  saveField(field: 'dateOfBirth' | 'email' | 'phone' | 'address'): void {
    const id = this.studentId();
    if (!id) return;

    const payload: any = {};
    if (field === 'email') payload.email = this.tempEmail().trim();
    if (field === 'phone') payload.phone = this.tempPhone().trim();
    if (field === 'dateOfBirth') payload.dateOfBirth = this.tempDob();
    if (field === 'address') payload.address = this.tempAddress();

    this.loading.set(true);
    this.studentService.updateStudent(id, payload).subscribe({
      next: (updated) => {
        this.student.set(updated);
        this.editingField.set(null);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error updating student field:', err);
        this.loading.set(false);
      }
    });
  }

  toInputDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
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

  onDobInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.tempDob.set(value);
  }

  onEmailInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.tempEmail.set(value);
  }

  onPhoneInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.tempPhone.set(value);
  }

  onAddressInput(
    field: 'street' | 'city' | 'state' | 'postalCode' | 'country',
    event: Event
  ): void {
    const value = (event.target as HTMLInputElement).value;
    this.tempAddress.set({
      ...this.tempAddress(),
      [field]: value
    });
  }

  onNoteInput(event: Event): void {
    this.newNote.set((event.target as HTMLTextAreaElement).value);
  }

  addNote(): void {
    const id = this.studentId();
    if (!id) return;
    const note = this.newNote().trim();
    if (!note) return;

    const updatedNotes = [...this.notesList(), note];
    this.loading.set(true);
    this.studentService.updateStudent(id, { notes: updatedNotes.join('\n') }).subscribe({
      next: (updated) => {
        this.student.set(updated);
        this.notesList.set(updatedNotes);
        this.newNote.set('');
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error adding note:', err);
        this.loading.set(false);
      }
    });
  }

  deleteNote(index: number): void {
    const id = this.studentId();
    if (!id) return;
    const updatedNotes = this.notesList().filter((_, i) => i !== index);
    this.loading.set(true);
    this.studentService.updateStudent(id, { notes: updatedNotes.join('\n') }).subscribe({
      next: (updated) => {
        this.student.set(updated);
        this.notesList.set(updatedNotes);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error deleting note:', err);
        this.loading.set(false);
      }
    });
  }
}
