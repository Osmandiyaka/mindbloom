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
    totalSteps = 6;
    isEditMode = signal(false);
    studentId = signal<string | null>(null);
    loading = signal(false);
    submitting = signal(false);
    error = signal<string | null>(null);
    photoPreview = signal<string | null>(null);
    photoFile: File | null = null;

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
            enrollment: this.fb.group({
                admissionNumber: ['', Validators.required],
                admissionDate: ['', Validators.required],
                academicYear: ['', Validators.required],
                class: ['', Validators.required],
                section: [''],
                rollNumber: [''],
                previousSchool: [''],
                previousClass: ['']
            })
        });

        // Guardians
        this.guardiansForm = this.fb.group({
            guardians: this.fb.array([], Validators.required)
        });

        // Medical Information
        this.medicalForm = this.fb.group({
            medicalInfo: this.fb.group({
                bloodGroup: [''],
                allergies: this.fb.array([]),
                medicalConditions: this.fb.array([]),
                medications: this.fb.array([]),
                doctorName: [''],
                doctorPhone: [''],
                insuranceProvider: [''],
                insuranceNumber: ['']
            })
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
            enrollment: {
                admissionNumber: student.enrollment.admissionNumber,
                admissionDate: new Date(student.enrollment.admissionDate).toISOString().split('T')[0],
                academicYear: student.enrollment.academicYear,
                class: student.enrollment.class,
                section: student.enrollment.section,
                rollNumber: student.enrollment.rollNumber,
                previousSchool: student.enrollment.previousSchool,
                previousClass: student.enrollment.previousClass
            }
        });

        // Guardians
        student.guardians.forEach(guardian => {
            this.addGuardian(guardian);
        });

        // Medical Information
        if (student.medicalInfo) {
            this.medicalForm.patchValue({
                medicalInfo: {
                    bloodGroup: student.medicalInfo.bloodGroup,
                    doctorName: student.medicalInfo.doctorName,
                    doctorPhone: student.medicalInfo.doctorPhone,
                    insuranceProvider: student.medicalInfo.insuranceProvider,
                    insuranceNumber: student.medicalInfo.insuranceNumber
                }
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
        return this.medicalForm.get('medicalInfo')?.get(fieldName) as FormArray;
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
                // Check if there are any guardians
                if (this.guardians.length === 0) {
                    alert('Please add at least one guardian');
                    return false;
                }

                // Validate guardian forms
                if (this.guardiansForm.invalid) {
                    this.markFormGroupTouched(this.guardiansForm);
                    alert('Please fill in all required guardian fields (Name, Relationship, Phone)');
                    return false;
                }

                // Auto-set primary if only one guardian exists
                if (this.guardians.length === 1) {
                    this.guardians.at(0).get('isPrimary')?.setValue(true);
                } else {
                    // Ensure at least one primary guardian when multiple exist
                    const hasPrimary = this.guardians.controls.some(g => g.get('isPrimary')?.value);
                    if (!hasPrimary) {
                        alert('Please designate one guardian as primary');
                        return false;
                    }
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
    async submit(saveAndNew: boolean = false): Promise<void> {
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

        // Transform guardians data to match backend expectations
        const transformedGuardians = this.guardians.value.map((g: any) => {
            // Remove id field if present
            const { id, _id, ...guardianData } = g;

            // Check if guardian has a valid address
            const hasGuardianAddress = guardianData.address && (
                guardianData.address.street ||
                guardianData.address.city ||
                guardianData.address.state ||
                guardianData.address.postalCode ||
                guardianData.address.country
            );

            const guardian: any = {
                name: `${guardianData.firstName} ${guardianData.lastName}`.trim(),
                relationship: guardianData.relationship,
                phone: guardianData.phone,
                isPrimary: guardianData.isPrimary,
                isEmergencyContact: guardianData.isEmergencyContact
            };

            // Only add optional fields if they have values
            if (guardianData.email) guardian.email = guardianData.email;
            if (guardianData.occupation) guardian.occupation = guardianData.occupation;
            if (hasGuardianAddress) guardian.address = guardianData.address;

            return guardian;
        });

        // Get personal info and exclude id fields
        const { id, _id, ...personalInfo } = this.personalInfoForm.value;

        // Only include address if it has actual data
        const hasAddress = personalInfo.address && (
            personalInfo.address.street ||
            personalInfo.address.city ||
            personalInfo.address.state ||
            personalInfo.address.postalCode ||
            personalInfo.address.country
        );

        // Clean enrollment data - remove any id fields
        const { id: enrollId, _id: enroll_id, ...enrollmentData } = this.enrollmentForm.value.enrollment;

        const studentData: any = {
            firstName: personalInfo.firstName,
            lastName: personalInfo.lastName,
            dateOfBirth: personalInfo.dateOfBirth,
            gender: personalInfo.gender,
            enrollment: enrollmentData,
            guardians: transformedGuardians,
        };

        // Only add optional personal info fields if they have values
        if (personalInfo.middleName) studentData.middleName = personalInfo.middleName;
        if (personalInfo.nationality) studentData.nationality = personalInfo.nationality;
        if (personalInfo.religion) studentData.religion = personalInfo.religion;
        if (personalInfo.caste) studentData.caste = personalInfo.caste;
        if (personalInfo.motherTongue) studentData.motherTongue = personalInfo.motherTongue;
        if (personalInfo.email) studentData.email = personalInfo.email;
        if (personalInfo.phone) studentData.phone = personalInfo.phone;
        if (hasAddress) studentData.address = personalInfo.address;
        if (personalInfo.photo) studentData.photo = personalInfo.photo;
        if (personalInfo.notes) studentData.notes = personalInfo.notes;

        // Only include medicalInfo fields that have actual values
        const medicalData = this.medicalForm.value.medicalInfo;
        const allergies = this.getArrayItems('allergies').value.filter((v: string) => v);
        const medicalConditions = this.getArrayItems('medicalConditions').value.filter((v: string) => v);
        const medications = this.getArrayItems('medications').value.filter((v: string) => v);

        const medicalInfo: any = {};
        if (medicalData.bloodGroup) medicalInfo.bloodGroup = medicalData.bloodGroup;
        if (allergies.length > 0) medicalInfo.allergies = allergies;
        if (medicalConditions.length > 0) medicalInfo.medicalConditions = medicalConditions;
        if (medications.length > 0) medicalInfo.medications = medications;
        if (medicalData.doctorName) medicalInfo.doctorName = medicalData.doctorName;
        if (medicalData.doctorPhone) medicalInfo.doctorPhone = medicalData.doctorPhone;
        if (medicalData.insuranceProvider) medicalInfo.insuranceProvider = medicalData.insuranceProvider;
        if (medicalData.insuranceNumber) medicalInfo.insuranceNumber = medicalData.insuranceNumber;

        // Only include medicalInfo if it has data
        if (Object.keys(medicalInfo).length > 0) {
            studentData.medicalInfo = medicalInfo;
        }

        console.log('Submitting student data:', JSON.stringify(studentData, null, 2));

        const operation = this.isEditMode()
            ? this.studentService.updateStudent(this.studentId()!, studentData)
            : this.studentService.createStudent(studentData);

        operation.subscribe({
            next: () => {
                this.submitting.set(false);
                if (saveAndNew) {
                    // Reset all forms for new entry
                    this.initializeForms();
                    this.currentStep.set(1);
                    this.photoPreview.set(null);
                    this.photoFile = null;
                    alert('Student saved successfully! You can add another student.');
                } else {
                    this.router.navigate(['/students']);
                }
            },
            error: (err: any) => {
                this.error.set('Failed to save student');
                this.submitting.set(false);
                console.error('Error saving student:', err);
                console.error('Error details:', err.error);
                console.error('Error message:', err.message);
            }
        });
    }

    cancel(): void {
        if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
            this.router.navigate(['/students']);
        }
    }

    getStepStatus(step: number): 'completed' | 'current' | 'upcoming' {
        if (step < this.currentStep()) return 'completed';
        if (step === this.currentStep()) return 'current';
        return 'upcoming';
    }

    onPhotoSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.error.set('Please select an image file');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.error.set('Image size should be less than 5MB');
                return;
            }

            this.photoFile = file;

            // Create preview
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                this.photoPreview.set(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    removePhoto(): void {
        this.photoFile = null;
        this.photoPreview.set(null);
        this.personalInfoForm.patchValue({ photo: null });
    }
}
