import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

@Component({
    selector: 'app-student-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, CardComponent, ButtonComponent, BadgeComponent],
    template: `
    <div class="student-detail-page">
      <div class="page-hero">
        <div class="page-hero-header">
          <div class="page-hero-content">
            <div class="breadcrumb">
              <a [routerLink]="['/students']">Students</a>
              <span class="separator">/</span>
              <span>{{ student?.name }}</span>
            </div>
            <h1>{{ student?.name }}</h1>
            <p>Student ID: {{ student?.id }}</p>
          </div>
          <div class="page-hero-actions">
            <app-button variant="secondary">Edit</app-button>
            <app-button variant="danger">Delete</app-button>
          </div>
        </div>
      </div>

      <div class="card-grid">
        <app-card>
          <div class="card-header">
            <h3 class="card-title">Personal Information</h3>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <label>Full Name</label>
                <p>{{ student?.name }}</p>
              </div>
              <div class="info-item">
                <label>Email</label>
                <p>{{ student?.email }}</p>
              </div>
              <div class="info-item">
                <label>Phone</label>
                <p>{{ student?.phone }}</p>
              </div>
              <div class="info-item">
                <label>Date of Birth</label>
                <p>{{ student?.dob }}</p>
              </div>
            </div>
          </div>
        </app-card>

        <app-card>
          <div class="card-header">
            <h3 class="card-title">Academic Information</h3>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <label>Class</label>
                <p>{{ student?.class }}</p>
              </div>
              <div class="info-item">
                <label>Roll Number</label>
                <p>{{ student?.rollNo }}</p>
              </div>
              <div class="info-item">
                <label>Status</label>
                <p>
                  <app-badge [variant]="student?.status === 'Active' ? 'success' : 'neutral'">
                    {{ student?.status }}
                  </app-badge>
                </p>
              </div>
            </div>
          </div>
        </app-card>
      </div>
    </div>
  `,
    styles: [`
    .info-grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    .info-item {
      label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
        margin-bottom: 0.25rem;
      }

      p {
        font-size: 1rem;
        color: var(--text-primary);
        margin: 0;
      }
    }
  `]
})
export class StudentDetailComponent implements OnInit {
    studentId: string | null = null;
    student: any = null;

    constructor(private route: ActivatedRoute) { }

    ngOnInit(): void {
        this.studentId = this.route.snapshot.paramMap.get('id');
        // Load student data
        this.student = {
            id: this.studentId,
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1 234 567 8900',
            dob: 'January 15, 2008',
            class: 'Grade 10-A',
            rollNo: '10A-25',
            status: 'Active'
        };
    }
}
