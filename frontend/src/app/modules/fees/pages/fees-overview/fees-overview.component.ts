import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../../../shared/components/hero/hero.component';

@Component({
    selector: 'app-fees-overview',
    standalone: true,
    imports: [CommonModule, HeroComponent],
    template: `
    <div>
      <app-hero
        title="Fee Management"
        subtitle="Manage fee structure, collection, and student payments"
        image="assets/illustrations/finance.svg"
      />
    </div>
  `
})
export class FeesOverviewComponent { }
