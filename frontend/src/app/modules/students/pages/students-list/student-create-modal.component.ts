import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MbButtonComponent, MbModalComponent, MbModalFooterDirective } from '@mindbloom/ui';
import { Student } from '../../../../core/models/student.model';
import { StudentFormComponent } from '../../../setup/pages/students/student-form/student-form.component';

@Component({
  selector: 'app-student-create-modal',
  standalone: true,
  imports: [CommonModule, MbModalComponent, MbModalFooterDirective, MbButtonComponent, StudentFormComponent],
  templateUrl: './student-create-modal.component.html',
  styleUrls: ['./student-create-modal.component.scss'],
})
export class StudentCreateModalComponent {
  @ViewChild(StudentFormComponent) studentForm?: StudentFormComponent;

  @Input() open = false;

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() saveAndNew = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Student>();
  @Output() savedAndNewStudent = new EventEmitter<Student>();
  @Output() viewStudent = new EventEmitter<string>();

  submit(saveAndNew: boolean = false): void {
    void this.studentForm?.submit(saveAndNew);
  }

  isFormDirty(): boolean {
    const form = this.studentForm;
    if (!form) return false;
    return Boolean(
      form.personalInfoForm?.dirty
      || form.enrollmentForm?.dirty
      || form.guardiansForm?.dirty
      || form.medicalForm?.dirty
    );
  }

  isFormSubmitDisabled(): boolean {
    const form = this.studentForm;
    if (!form) return true;
    const guardiansInvalid = form.guardianEnabled() && form.guardiansForm?.invalid;
    const invalid = form.personalInfoForm?.invalid || form.enrollmentForm?.invalid || guardiansInvalid;
    return Boolean(form.submitting() || invalid);
  }

  buildSubmitHint(): string {
    if (!this.open || !this.isFormSubmitDisabled()) {
      return '';
    }
    const form = this.studentForm;
    if (!form) return '';
    const missing: string[] = [];
    const personal = form.personalInfoForm;
    const enrollment = form.enrollmentForm;

    const requiredChecks: Array<{ key: string; label: string }> = [
      { key: 'firstName', label: 'First name' },
      { key: 'lastName', label: 'Last name' },
      { key: 'dateOfBirth', label: 'Date of birth' },
      { key: 'gender', label: 'Gender' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
    ];

    requiredChecks.forEach(({ key, label }) => {
      if (!form.isRequiredField(key)) return;
      if (personal.get(key)?.hasError('required')) {
        missing.push(label);
      }
    });

    if (enrollment.get('enrollment.academicYear')?.hasError('required')) {
      missing.push('Academic year');
    }
    if (enrollment.get('enrollment.admissionDate')?.hasError('required')) {
      missing.push('Enrollment date');
    }
    if (enrollment.get('enrollment.class')?.hasError('required')) {
      missing.push('Class');
    }
    if (enrollment.get('enrollment.section')?.hasError('required')) {
      missing.push('Section');
    }

    if (!missing.length) return '';
    const list = missing.slice(0, 3).join(', ');
    const suffix = missing.length > 3 ? '…' : '';
    return `Missing required fields: ${list}${suffix}`;
  }
}
