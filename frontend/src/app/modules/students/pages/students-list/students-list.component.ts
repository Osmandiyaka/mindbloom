import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeroComponent } from '../../../../shared/components/hero/hero.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

@Component({
    selector: 'app-students-list',
    standalone: true,
    imports: [CommonModule, RouterModule, HeroComponent, CardComponent, ButtonComponent, BadgeComponent],
    template: `
    <div class="students-page">
      <!-- Hero Section -->
      <app-hero
        title="Students"
        subtitle="Manage student profiles, records, and academic information"
        image="assets/illustrations/students.svg"
        [showActions]="true">
        <div actions>
          <app-button variant="primary">
            + Add New Student
          </app-button>
        </div>
      </app-hero>

      <!-- Table Toolbar -->
      <div class="table-toolbar mt-6">
        <div class="toolbar-left">
          <div class="search-input">
            <input
              type="search"
              class="form-control"
              placeholder="Search students..."
            />
          </div>
        </div>
        <div class="toolbar-right">
          <app-button variant="secondary" size="sm">
            Export
          </app-button>
          <app-button variant="secondary" size="sm">
            Filter
          </app-button>
        </div>
      </div>

      <!-- Data Table -->
      <div class="data-table">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th class="sortable">Student ID</th>
                <th class="sortable">Name</th>
                <th>Class</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let student of students" class="row-clickable" [routerLink]="['/students', student.id]">
                <td class="col-primary">{{ student.id }}</td>
                <td class="col-primary">{{ student.name }}</td>
                <td>{{ student.class }}</td>
                <td>{{ student.email }}</td>
                <td>
                  <app-badge [variant]="student.status === 'Active' ? 'success' : 'neutral'" size="sm">
                    {{ student.status }}
                  </app-badge>
                </td>
                <td>
                  <div class="cell-actions">
                    <button title="Edit">✏️</button>
                    <button title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-footer">
          <div class="table-info">Showing 1-10 of 150 students</div>
          <div class="table-pagination">
            <button disabled>Previous</button>
            <button class="active">1</button>
            <button>2</button>
            <button>3</button>
            <button>Next</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentsListComponent implements OnInit {
    students = [
        { id: 'STU001', name: 'John Doe', class: 'Grade 10-A', email: 'john@example.com', status: 'Active' },
        { id: 'STU002', name: 'Jane Smith', class: 'Grade 10-B', email: 'jane@example.com', status: 'Active' },
        { id: 'STU003', name: 'Mike Johnson', class: 'Grade 9-A', email: 'mike@example.com', status: 'Active' },
        { id: 'STU004', name: 'Sarah Williams', class: 'Grade 11-A', email: 'sarah@example.com', status: 'Inactive' },
    ];

    ngOnInit(): void {
        // Load students data
    }
}
