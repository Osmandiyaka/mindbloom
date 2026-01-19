import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MbButtonComponent,
  MbCheckboxComponent,
  MbInputComponent,
  MbModalComponent,
  MbModalFooterDirective,
  MbSelectComponent,
} from '@mindbloom/ui';
import type { StudentsListComponent } from './students-list.component';

@Component({
  selector: 'app-student-guardian-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MbModalComponent,
    MbModalFooterDirective,
    MbButtonComponent,
    MbInputComponent,
    MbSelectComponent,
    MbCheckboxComponent,
  ],
  templateUrl: './student-guardian-modal.component.html',
  styleUrls: ['./students-list.component.scss'],
})
export class StudentGuardianModalComponent {
  @Input({ required: true }) open = false;
  @Input({ required: true }) vm!: StudentsListComponent;
}
