import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    imports: [CommonModule],
    selector: 'app-host-dashboard',
    template: `
    <section class="host-shell">
      <header class="host-header">
        <h1>Host Console</h1>
        <p>Cross-tenant administration for editions, tenants, and subscriptions.</p>
      </header>
      <div class="host-grid">
        <article class="host-card">
          <h3>Tenant Catalog</h3>
          <p>Review tenants, editions, and subscription states.</p>
        </article>
        <article class="host-card">
          <h3>Edition Library</h3>
          <p>Manage platform editions and feature bundles.</p>
        </article>
        <article class="host-card">
          <h3>Platform Insights</h3>
          <p>Monitor usage and health across all tenants.</p>
        </article>
      </div>
    </section>
  `,
    styles: [`
    .host-shell {
      padding: 32px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .host-header h1 {
      font-size: 28px;
      margin: 0 0 4px 0;
    }
    .host-header p {
      margin: 0 0 20px 0;
      color: #4b5563;
    }
    .host-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }
    .host-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
    }
    .host-card h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
    }
    .host-card p {
      margin: 0;
      color: #6b7280;
      line-height: 1.5;
    }
  `]
})
export class HostDashboardComponent { }
