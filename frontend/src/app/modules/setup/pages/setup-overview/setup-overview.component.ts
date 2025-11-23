import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeroComponent } from '../../../../shared/components/hero/hero.component';

@Component({
  selector: 'app-setup-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, HeroComponent],
  template: `
    <div>
      <app-hero
        title="System Setup & Configuration"
        subtitle="Configure system settings, preferences, and school information"
        image="assets/illustrations/setup.svg"
      />
      
      <div class="setup-grid">
        <a routerLink="/setup/roles" class="setup-card">
          <div class="card-icon">🔐</div>
          <h3>Roles & Permissions</h3>
          <p>Manage user roles and access control. Create custom roles with specific permissions.</p>
          <span class="card-link">Manage Roles →</span>
        </a>

        <div class="setup-card disabled">
          <div class="card-icon">⚙️</div>
          <h3>School Settings</h3>
          <p>Configure school information, academic year, and general settings.</p>
          <span class="card-link">Coming Soon</span>
        </div>

        <div class="setup-card disabled">
          <div class="card-icon">👥</div>
          <h3>User Management</h3>
          <p>Manage users, assign roles, and control access to the system.</p>
          <span class="card-link">Coming Soon</span>
        </div>

        <div class="setup-card disabled">
          <div class="card-icon">🔌</div>
          <h3>Integrations</h3>
          <p>Connect with third-party services and manage API access.</p>
          <span class="card-link">Coming Soon</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .setup-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .setup-card {
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 2rem;
      transition: all 0.2s;
      text-decoration: none;
      color: inherit;
      display: block;
    }

    .setup-card:not(.disabled):hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-4px);
      border-color: #3B82F6;
    }

    .setup-card.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .card-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .setup-card h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .setup-card p {
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0 0 1rem 0;
    }

    .card-link {
      color: #3B82F6;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .setup-card.disabled .card-link {
      color: #9CA3AF;
    }
  `]
})
export class SetupOverviewComponent { }
