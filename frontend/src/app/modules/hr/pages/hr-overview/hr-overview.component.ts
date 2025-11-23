import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../../../shared/components/hero/hero.component';

@Component({
    selector: 'app-hr-overview',
    standalone: true,
    imports: [CommonModule, HeroComponent],
    template: `
    <div>
      <app-hero
        title="Human Resources"
        subtitle="Manage staff, employee records, and HR operations"
        image="assets/illustrations/hr.svg"
      />
    </div>
  `
})
export class HrOverviewComponent { }
