import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../../../shared/components/hero/hero.component';

@Component({
    selector: 'app-attendance-overview',
    standalone: true,
    imports: [CommonModule, HeroComponent],
    template: `
    <div>
      <app-hero
        title="Attendance"
        subtitle="Track and manage student and staff attendance"
        image="assets/illustrations/attendance.svg"
      />
    </div>
  `
})
export class AttendanceOverviewComponent { }
