import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../../../shared/components/hero/hero.component';

@Component({
    selector: 'app-payroll-overview',
    standalone: true,
    imports: [CommonModule, HeroComponent],
    template: `
    <div>
      <app-hero
        title="Payroll Management"
        subtitle="Process salaries, manage payroll, and generate payslips"
        image="assets/illustrations/finance.svg"
      />
    </div>
  `
})
export class PayrollOverviewComponent { }
