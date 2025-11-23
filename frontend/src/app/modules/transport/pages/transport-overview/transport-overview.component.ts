import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../../../shared/components/hero/hero.component';

@Component({
    selector: 'app-transport-overview',
    standalone: true,
    imports: [CommonModule, HeroComponent],
    template: `
    <div>
      <app-hero
        title="Transport Management"
        subtitle="Manage vehicles, routes, drivers, and student transportation"
        image="assets/illustrations/transport.svg"
      />
    </div>
  `
})
export class TransportOverviewComponent { }
