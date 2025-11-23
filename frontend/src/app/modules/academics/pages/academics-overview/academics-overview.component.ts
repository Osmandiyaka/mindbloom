import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../../../shared/components/hero/hero.component';

@Component({
    selector: 'app-academics-overview',
    standalone: true,
    imports: [CommonModule, HeroComponent],
    template: `
    <div>
      <app-hero
        title="Academics"
        subtitle="Manage classes, subjects, curriculum, and academic schedules"
        image="assets/illustrations/academics.svg"
      />
      <div class="mt-6">
        <p>Academics module content goes here...</p>
      </div>
    </div>
  `
})
export class AcademicsOverviewComponent { }
