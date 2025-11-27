import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../../../shared/components/hero/hero.component';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-hostel-overview',
    standalone: true,
    imports: [CommonModule, HeroComponent, RouterModule],
    template: `
      <div class="page">
        <app-hero
          title="Hostel Management"
          subtitle="Manage hostels, rooms, beds, and student allocation"
          image="assets/illustrations/hostel.svg"
        />

        <section class="grid">
          <a class="card" routerLink="/hostel/rooms">
            <h3>🏠 Hostels & Rooms</h3>
            <p class="muted">Create hostels, add rooms and beds.</p>
          </a>
          <a class="card" routerLink="/hostel/allocations">
            <h3>🛏️ Allocations</h3>
            <p class="muted">Assign students to beds, track occupancy.</p>
          </a>
        </section>
      </div>
    `,
    styles: [`
      .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
      .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap:1rem; }
      .card { text-decoration:none; background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; color: var(--color-text-primary); box-shadow: var(--shadow-sm); }
      .card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
      .muted { color: var(--color-text-secondary); }
    `]
})
export class HostelOverviewComponent { }
