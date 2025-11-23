import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../../../shared/components/hero/hero.component';

@Component({
    selector: 'app-setup-overview',
    standalone: true,
    imports: [CommonModule, HeroComponent],
    template: `
    <div>
      <app-hero
        title="System Setup & Configuration"
        subtitle="Configure system settings, preferences, and school information"
        image="assets/illustrations/setup.svg"
      />
    </div>
  `
})
export class SetupOverviewComponent { }
