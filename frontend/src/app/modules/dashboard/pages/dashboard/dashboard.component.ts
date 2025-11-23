import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../../../shared/components/hero/hero.component';
import { StatsCardComponent } from '../../../../shared/components/stats-card/stats-card.component';
import { CardComponent } from '../../../../shared/components/card/card.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, HeroComponent, StatsCardComponent, CardComponent],
    template: `
    <div class="dashboard-page">
      <!-- Hero Section -->
      <app-hero
        title="Welcome to MindBloom"
        subtitle="Your comprehensive school management solution"
        image="assets/illustrations/dashboard.svg"
        [showActions]="true">
        <div actions>
          <!-- Actions can go here -->
        </div>
      </app-hero>

      <!-- KPI Cards -->
      <div class="card-grid mt-6">
        <app-stats-card
          icon="👨‍🎓"
          label="Total Students"
          [value]="stats.totalStudents"
          change="+12% from last month"
          changeType="positive"
          iconColor="blue"
        />
        <app-stats-card
          icon="👥"
          label="Total Staff"
          [value]="stats.totalStaff"
          change="+3 new this month"
          changeType="positive"
          iconColor="success"
        />
        <app-stats-card
          icon="💰"
          label="Fee Collection"
          [value]="'$' + stats.feeCollection"
          change="85% collected"
          changeType="positive"
          iconColor="success"
        />
        <app-stats-card
          icon="📚"
          label="Active Classes"
          [value]="stats.activeClasses"
          iconColor="blue"
        />
      </div>

      <!-- Recent Activity -->
      <div class="mt-8">
        <app-card>
          <div class="card-header">
            <h3 class="card-title">Recent Activity</h3>
            <p class="card-subtitle">Latest updates from your school</p>
          </div>
          <div class="card-body">
            <p>Activity feed will be displayed here...</p>
          </div>
        </app-card>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
    stats = {
        totalStudents: 1247,
        totalStaff: 85,
        feeCollection: 125000,
        activeClasses: 42
    };

    ngOnInit(): void {
        // Load dashboard data
    }
}
