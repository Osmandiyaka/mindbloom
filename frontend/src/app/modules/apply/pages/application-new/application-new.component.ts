import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdmissionsApiService, CreateApplicationDto } from '../../services/admissions-api.service';

@Component({
  selector: 'app-application-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './application-new.component.html',
  styleUrls: ['./application-new.component.scss']
})
export class ApplicationNewComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private admissionsApi = inject(AdmissionsApiService);

  currentStep = signal(1);
  totalSteps = 5;
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);

  // Form Groups for each step
  personalInfoForm: FormGroup;
  guardianInfoForm: FormGroup;
  academicInfoForm: FormGroup;
  documentsForm: FormGroup;

  constructor() {
    this.personalInfoForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      middleName: [''],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      nationality: [''],
      religion: [''],
      bloodGroup: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s-()]+$/)]],
      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        country: [''],
        postalCode: ['']
      })
    });

    this.guardianInfoForm = this.fb.group({
      guardians: this.fb.array([this.createGuardianFormGroup()])
    });

    this.academicInfoForm = this.fb.group({
      gradeApplying: ['', Validators.required],
      academicYear: ['', Validators.required],
      previousSchool: this.fb.group({
        schoolName: [''],
        grade: [''],
        yearAttended: ['']
      }),
      notes: ['']
    });

    this.documentsForm = this.fb.group({
      documents: this.fb.array([])
    });
  }

  // Guardian Form Array Helpers
  get guardians(): FormArray {
    return this.guardianInfoForm.get('guardians') as FormArray;
  }

  createGuardianFormGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      relationship: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s-()]+$/)]],
      email: ['', Validators.email],
      occupation: [''],
      address: [''],
      isEmergencyContact: [false],
      isPrimaryContact: [false]
    });
  }

  addGuardian(): void {
    this.guardians.push(this.createGuardianFormGroup());
  }

  removeGuardian(index: number): void {
    if (this.guardians.length > 1) {
      this.guardians.removeAt(index);
    }
  }

  // Document Form Array Helpers
  get documents(): FormArray {
    return this.documentsForm.get('documents') as FormArray;
  }

  addDocument(file: { name: string; type: string; url: string }): void {
    const docGroup = this.fb.group({
      name: [file.name],
      type: [file.type],
      url: [file.url]
    });
    this.documents.push(docGroup);
  }

  removeDocument(index: number): void {
    this.documents.removeAt(index);
  }

  // Navigation
  nextStep(): void {
    const currentForm = this.getCurrentStepForm();
    if (currentForm && currentForm.valid) {
      if (this.currentStep() < this.totalSteps) {
        this.currentStep.update(step => step + 1);
      }
    } else {
      currentForm?.markAllAsTouched();
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
    }
  }

  goToStep(step: number): void {
    // Only allow going to completed or current step
    if (step <= this.currentStep() || this.isStepValid(this.currentStep())) {
      this.currentStep.set(step);
    }
  }

  private getCurrentStepForm(): FormGroup | null {
    switch (this.currentStep()) {
      case 1: return this.personalInfoForm;
      case 2: return this.guardianInfoForm;
      case 3: return this.academicInfoForm;
      case 4: return this.documentsForm;
      case 5: return null; // Review step
      default: return null;
    }
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1: return this.personalInfoForm.valid;
      case 2: return this.guardianInfoForm.valid;
      case 3: return this.academicInfoForm.valid;
      case 4: return true; // Documents optional
      case 5: return true; // Review step
      default: return false;
    }
  }

  isStepComplete(step: number): boolean {
    return step < this.currentStep();
  }

  // File Upload Handler (placeholder - will be implemented with upload service)
  onFileSelected(event: Event, documentType: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // TODO: Upload file to server and get URL
      // For now, create placeholder
      const mockUrl = `uploads/${file.name}`;
      this.addDocument({
        name: documentType,
        type: file.type,
        url: mockUrl
      });
    }
  }

  // Submit
  async submitApplication(): Promise<void> {
    if (this.isSubmitting()) return;

    // Validate all forms
    const allValid = this.personalInfoForm.valid && 
                     this.guardianInfoForm.valid && 
                     this.academicInfoForm.valid;

    if (!allValid) {
      this.submitError.set('Please complete all required fields');
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    try {
      const applicationData: CreateApplicationDto = {
        ...this.personalInfoForm.value,
        guardians: this.guardianInfoForm.value.guardians,
        ...this.academicInfoForm.value,
        documents: this.documentsForm.value.documents
      };

      const result = await this.admissionsApi.createApplication(applicationData).toPromise();
      
      // Navigate to status page with application number
      this.router.navigate(['/apply/application/status', result?.applicationNumber]);
    } catch (error: any) {
      this.submitError.set(error.error?.message || 'Failed to submit application. Please try again.');
      this.isSubmitting.set(false);
    }
  }

  // Helper getters for template
  getReviewData() {
    return {
      personal: this.personalInfoForm.value,
      guardians: this.guardianInfoForm.value.guardians,
      academic: this.academicInfoForm.value,
      documents: this.documentsForm.value.documents
    };
  }
}
