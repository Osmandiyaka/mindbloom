import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../../../shared/components/hero/hero.component';

@Component({
    selector: 'app-library-overview',
    standalone: true,
    imports: [CommonModule, HeroComponent],
    template: `
    <div>
      <app-hero
        title="Library Management"
        subtitle="Manage books, inventory, issue and return tracking"
        image="assets/illustrations/library.svg"
      />
    </div>
  `
})
export class LibraryOverviewComponent { }
