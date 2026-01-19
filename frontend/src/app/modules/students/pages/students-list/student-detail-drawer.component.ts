import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  MbButtonComponent,
  MbDrawerComponent,
  MbTableActionsDirective,
  MbTableComponent,
} from '@mindbloom/ui';
import { CanDirective } from '../../../../shared/security/can.directive';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';
import type { StudentsListComponent } from './students-list.component';

@Component({
  selector: 'app-student-detail-drawer',
  standalone: true,
  imports: [
    CommonModule,
    MbDrawerComponent,
    MbButtonComponent,
    MbTableComponent,
    MbTableActionsDirective,
    CanDirective,
    TooltipDirective,
  ],
  templateUrl: './student-detail-drawer.component.html',
  styleUrls: ['./students-list.component.scss'],
})
export class StudentDetailDrawerComponent {
  @Input({ required: true }) open = false;
  @Input({ required: true }) vm!: StudentsListComponent;
}
