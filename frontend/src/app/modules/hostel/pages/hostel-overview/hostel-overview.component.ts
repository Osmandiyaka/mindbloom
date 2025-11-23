import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../../../shared/components/hero/hero.component';

@Component({
    selector: 'app-hostel-overview',
    standalone: true,
    imports: [CommonModule, HeroComponent],
    template: `
    <div>
      <app-hero
        title="Hostel Management"
        subtitle="Manage hostel accommodation, rooms, and student allocation"
        image="assets/illustrations/hostel.svg"
      />
    </div>
  `
})
export class HostelOverviewComponent { }
