import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { StudentService } from '../../../../../core/services/student.service';
import { Student, Gender, BloodGroup, RelationshipType } from '../../../../../core/models/student.model';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.scss']
})
export class StudentFormComponent implements OnInit {
  currentStep = signal(1);
  totalSteps = 4;
  isEditMode = signal(false);
  studentId = signal<string | null>(null);
  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);

  // Enums for templates
  Gender = Gender;
  BloodGroup = BloodGroup;
  RelationshipType = RelationshipType;

  // Form groups
  personalInfoForm!: FormGroup;
  enrollmentForm!: FormGroup;
  guardiansForm!: FormGroup;
  medicalForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.studentId.set(id);
      this.loadStudent(id);
    } else {
      // Add one guardian by default
      this.addGuardian();
    }
  }

  initializeForms(): void {
    // Personal Information
    this.personalInfoForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      middleName: [''],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      nationality: [''],
      religion: [''],
      caste: [''],
      motherTongue: [''],
      email: ['', [Validators.email]],
      phone: [''],
      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        postalCode: [''],
        country: ['']
      }),
      photo: [''],
      notes: ['']
    });

    // Enrollment Information
    this.enrollmentForm = this.fb.group({
      admissionNumber: ['', Validators.required],
      admissionDate: ['', Validators.required],
      academicYear: ['', Validators.required],
      class: ['', Validators.required],
      section: [''],
      rollNumber: [''],
      previousSchool: [''],
      previousClass: ['']
    });

    // Guardians
    this.guardiansForm = this.fb.group({
      guardians: this.fb.array([], Validators.required)
    });

    // Medical Information
    this.medicalForm = this.fb.group({
      bloodGroup: [''],
      allergies: this.fb.array([]),
      medicalConditions: this.fb.array([]),
      medications: this.fb.array([]),
      doctorName: [''],
      doctorPhone: [''],
      insuranceProvider: [''],
      insuranceNumber: ['']
    });
  }

  loadStudent(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.studentService.getStudent(id).subscribe({
      next: (student) => {
        this.populateForms(student);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load student');
        this.loading.set(false);
        console.error('Error loading student:', err);
      }
    });
  }

  populateForms(student: Student): void {
    // Personal Information
    this.personalInfoForm.patchValue({
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName,
      dateOfBirth: new Date(student.dateOfBirth).toISOString().split('T')[0],
      gender: student.gender,
      nationality: student.nationality,
      religion: student.religion,
      caste: student.caste,
      motherTongue: student.motherTongue,
      email: student.email,
      phone: student.phone,
      address: student.address || {},
      photo: student.photo,
      notes: student.notes
    });

    // Enrollment Information
    this.enrollmentForm.patchValue({
      admissionNumber: student.enrollment.admissionNumber,
      admissionDate: new Date(student.enrollment.admissionDate).toISOString().split('T')[0],
      academicYear: student.enrollment.academicYear,
      class: student.enrollment.class,
      section: student.enrollment.section,
      rollNumber: student.enrollment.rollNumber,
      previousSchool: student.enrollment.previousSchool,
      previousClass: student.enrollment.previousClass
    });

    // Guardians
    student.guardians.forEach(guardian => {
      this.addGuardian(guardian);
    });

    // Medical Information
    if (student.medicalInfo) {
      this.medicalForm.patchValue({
        bloodGroup: student.medicalInfo.bloodGroup,
        doctorName: student.medicalInfo.doctorName,
        doctorPhone: student.medicalInfo.doctorPhone,
        insuranceProvider: student.medicalInfo.insuranceProvider,
        insuranceNumber: student.medicalInfo.insuranceNumber
      });

      student.medicalInfo.allergies?.forEach(allergy => {
        this.addArrayItem('allergies', allergy);
      });
      student.medicalInfo.medicalConditions?.forEach(condition => {
        this.addArrayItem('medicalConditions', condition);
      });
      student.medicalInfo.medications?.forEach(medication => {
        this.addArrayItem('medications', medication);
      });
    }
  }

  // Guardian Management
  get guardians(): FormArray {
    return this.guardiansForm.get('guardians') as FormArray;
  }

  addGuardian(guardian?: any): void {
    const guardianGroup = this.fb.group({
      name: [guardian?.name || '', Validators.required],
      relationship: [guardian?.relationship || '', Validators.required],
      phone: [guardian?.phone || '', Validators.required],
      email: [guardian?.email || '', Validators.email],
      occupation: [guardian?.occupation || ''],
      address: this.fb.group({
        street: [guardian?.address?.street || ''],
        city: [guardian?.address?.city || ''],
        state: [guardian?.address?.state || ''],
        postalCode: [guardian?.address?.postalCode || ''],
        country: [guardian?.address?.country || '']
      }),
      isPrimary: [guardian?.isPrimary || false],
      isEmergencyContact: [guardian?.isEmergencyContact || false]
    });

    this.guardians.push(guardianGroup);
  }

  removeGuardian(index: number): void {
    if (this.guardians.length > 1) {
      this.guardians.removeAt(index);
    } else {
      alert('At least one guardian is required');
    }
  }

  setPrimaryGuardian(index: number): void {
    this.guardians.controls.forEach((control, i) => {
      control.get('isPrimary')?.setValue(i === index);
    });
  }

  // Array Items Management
  getArrayItems(fieldName: string): FormArray {
    return this.medicalForm.get(fieldName) as FormArray;
  }

  addArrayItem(fieldName: string, value: string = ''): void {
    this.getArrayItems(fieldName).push(this.fb.control(value));
  }

  removeArrayItem(fieldName: string, index: number): void {
    this.getArrayItems(fieldName).removeAt(index);
  }

  // Navigation
  nextStep(): void {
    if (this.validateCurrentStep()) {
      if (this.currentStep() < this.totalSteps) {
        this.currentStep.update(step => step + 1);
      }
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep.set(step);
    }
  }

  validateCurrentStep(): boolean {
    switch (this.currentStep()) {
      case 1:
        if (this.personalInfoForm.invalid) {
          this.markFormGroupTouched(this.personalInfoForm);
          return false;
        }
        return true;
      case 2:
        if (this.enrollmentForm.invalid) {
          this.markFormGroupTouched(this.enrollmentForm);
          return false;
        }
        return true;
      case 3:
        if (this.guardiansForm.invalid) {
          this.markFormGroupTouched(this.guardiansForm);
          return false;
        }
        // Ensure at least one primary guardian
        const hasPrimary = this.guardians.controls.some(g => g.get('isPrimary')?.value);
        if (!hasPrimary) {
          alert('Please designate one guardian as primary');
          return false;
        }
        return true;
      case 4:
        return true; // Medical info is optional
      default:
        return true;
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(c => {
          if (c instanceof FormGroup) {
            this.markFormGroupTouched(c);
          }
        });
      }
    });
  }

  // Submit
  async submit(): Promise<void> {
    if (!this.validateCurrentStep()) {
      return;
    }

    // Validate all forms
    if (this.personalInfoForm.invalid || this.enrollmentForm.invalid || this.guardiansForm.invalid) {
      alert('Please fill in all required fields');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const studentData = {
      ...this.personalInfoForm.value,
      enrollment: this.enrollmentForm.value,
      guardians: this.guardians.value,
      medicalInfo: {
        ...this.medicalForm.value,
        allergies: this.getArrayItems('allergies').value,
        medicalConditions: this.getArrayItems('medicalConditions').value,
        medications: this.getArrayItems('medications').value
      }
    };

    const operation = this.isEditMode()
      ? this.studentService.updateStudent(this.studentId()!, studentData)
      : this.studentService.createStudent(studentData);

    operation.subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/setup/students']);
      },
      error: (err) => {
        this.error.set('Failed to save student');
        this.submitting.set(false);
        console.error('Error saving student:', err);
      }
    });
  }

  cancel(): void {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
      this.router.navigate(['/setup/students']);
    }
  }

  getStepStatus(step: number): 'completed' | 'current' | 'upcoming' {
    if (step < this.currentStep()) return 'completed';
    if (step === this.currentStep()) return 'current';
    return 'upcoming';
  }
}
