import { Component, EventEmitter, Input, OnInit, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { StudentService } from '../../../../../core/services/student.service';
import { Student, Gender, BloodGroup, RelationshipType } from '../../../../../core/models/student.model';
import { RbacService } from '../../../../../core/rbac/rbac.service';
import { PERMISSIONS } from '../../../../../core/rbac/permission.constants';
import { TenantService, Tenant } from '../../../../../core/services/tenant.service';
import { TenantSettingsService } from '../../../../../core/services/tenant-settings.service';
import { IconRegistryService } from '../../../../../shared/services/icon-registry.service';
import { SchoolContextService } from '../../../../../core/school/school-context.service';
import { MbClassStatusSelection, MbClassStatusSelectorComponent } from '../../../../../shared/components/class-status-selector/class-status-selector.component';
import { MbButtonComponent, MbCheckboxComponent, MbInputComponent, MbSelectComponent, MbSelectOption, MbTextareaComponent } from '@mindbloom/ui';

@Component({
    selector: 'app-student-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MbClassStatusSelectorComponent,
        MbInputComponent,
        MbSelectComponent,
        MbTextareaComponent,
        MbButtonComponent,
        MbCheckboxComponent
    ],
    templateUrl: './student-form.component.html',
    styleUrls: ['./student-form.component.scss']
})
export class StudentFormComponent implements OnInit {
    @Input() embedded = false;
    @Output() saved = new EventEmitter<Student>();
    @Output() savedAndNew = new EventEmitter<Student>();
    @Output() viewStudent = new EventEmitter<string>();

    currentStep = signal(1);
    totalSteps = 6;
    isEditMode = signal(false);
    studentId = signal<string | null>(null);
    loading = signal(false);
    submitting = signal(false);
    error = signal<string | null>(null);
    submitAttempted = signal(false);
    saveNotice = signal<string | null>(null);
    photoPreview = signal<string | null>(null);
    photoFile: File | null = null;
    templateSettings: Tenant['idTemplates'] | null = null;
    schoolId = signal<string | null>(null);
    selectedClassId = signal<string | null>(null);
    selectedSectionId = signal<string | null>(null);
    studentSchema = signal<Record<string, boolean> | null>(null);
    academicYearOptions: MbSelectOption[] = [];
    academicYearLoading = signal(true);
    guardianEnabled = signal(true);
    guardianRequired = signal(false);
    guardianRelationshipsLoading = signal(false);
    guardianRelationshipOptions = signal<MbSelectOption[]>([]);
    duplicateMatches = signal<Student[]>([]);
    duplicateLoading = signal(false);
    duplicateError = signal<string | null>(null);
    guardianRelationshipSelectOptions = computed(() => {
        const options = this.guardianRelationshipOptions();
        return options.length ? options : this.relationshipOptions;
    });
    canManageEnrollment = computed(() => this.rbac.can(PERMISSIONS.students.write));
    canManageGuardians = computed(() => this.rbac.can(PERMISSIONS.students.write));
    schoolOptions = computed(() => this.schoolContext.schools().map((school) => ({
        label: school.name,
        value: school.id
    })));
    showSchoolSelector = computed(() => this.schoolOptions().length > 1);

    // Enums for templates
    Gender = Gender;
    BloodGroup = BloodGroup;
    RelationshipType = RelationshipType;

    // Dropdown data
    academicYears: string[] = ['2024-2025', '2025-2026', '2026-2027'];
    classes: string[] = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    sections: string[] = ['A', 'B', 'C', 'D'];
    genderOptions: MbSelectOption[] = [
        { label: 'Male', value: Gender.MALE },
        { label: 'Female', value: Gender.FEMALE },
        { label: 'Other', value: Gender.OTHER }
    ];
    relationshipOptions: MbSelectOption[] = [
        { label: 'Father', value: RelationshipType.FATHER },
        { label: 'Mother', value: RelationshipType.MOTHER },
        { label: 'Guardian', value: RelationshipType.GUARDIAN },
        { label: 'Sibling', value: RelationshipType.SIBLING },
        { label: 'Grandparent', value: RelationshipType.GRANDPARENT },
        { label: 'Other', value: RelationshipType.OTHER }
    ];

    // Form groups
    personalInfoForm!: FormGroup;
    enrollmentForm!: FormGroup;
    guardiansForm!: FormGroup;
    medicalForm!: FormGroup;

    constructor(
        private fb: FormBuilder,
        private studentService: StudentService,
        private router: Router,
        private route: ActivatedRoute,
        private tenantService: TenantService,
        private tenantSettingsService: TenantSettingsService,
        private schoolContext: SchoolContextService,
        private rbac: RbacService,
        public iconRegistry: IconRegistryService,
    ) {
        this.initializeForms();
    }

    ngOnInit(): void {
        const activeSchool = this.schoolContext.activeSchool();
        if (activeSchool?.id) {
            this.schoolId.set(activeSchool.id);
        }
        const id = this.route.snapshot.paramMap.get('id');
        if (id && id !== 'new') {
            this.isEditMode.set(true);
            this.studentId.set(id);
            this.loadStudent(id);
        } else {
            // Add one guardian by default
            if (this.guardianEnabled()) {
                this.addGuardian();
            }
        }
        // hydrate template settings from cached tenant or API
        this.templateSettings = this.tenantService.getCurrentTenantValue()?.idTemplates || null;
        const tenantSettings = this.tenantService.getCurrentTenantValue();
        if (tenantSettings?.extras?.['studentSchema']) {
            this.applyStudentSchema(tenantSettings.extras['studentSchema']);
        }
        if (tenantSettings?.extras?.['guardianRequired']) {
            this.guardianRequired.set(Boolean(tenantSettings.extras['guardianRequired']));
            this.guardianEnabled.set(Boolean(tenantSettings.extras['guardianRequired']));
        }
        if (tenantSettings?.academicYear) {
            this.setAcademicYearOptions(this.buildAcademicYearOptions(tenantSettings.academicYear));
        }
        if (!this.templateSettings || !this.studentSchema()) {
            this.tenantSettingsService.getSettings().subscribe({
                next: (tenant) => {
                    this.templateSettings = tenant.idTemplates || null;
                    if (tenant.extras?.['studentSchema']) {
                        this.applyStudentSchema(tenant.extras['studentSchema']);
                    }
                    if (tenant.extras?.['guardianRequired']) {
                        this.guardianRequired.set(Boolean(tenant.extras['guardianRequired']));
                        this.guardianEnabled.set(Boolean(tenant.extras['guardianRequired']));
                    }
                    if (tenant.academicYear) {
                        this.setAcademicYearOptions(this.buildAcademicYearOptions(tenant.academicYear));
                    }
                    this.academicYearLoading.set(false);
                },
                error: () => {
                    this.academicYearLoading.set(false);
                }
            });
        }
        if (this.academicYearOptions.length) {
            this.academicYearLoading.set(false);
        }
        this.loadGuardianRelationships();
        this.syncGuardianValidators();
        this.ensureEnrollmentDefaults();
    }

    private get currentTenant(): Tenant | null {
        return this.tenantService.getCurrentTenantValue();
    }

    private nextSequence(length: number): string {
        const max = Math.pow(10, length) - 1;
        const min = Math.pow(10, length - 1);
        const n = Math.floor(Math.random() * (max - min + 1)) + min;
        return String(n).padStart(length, '0');
    }

    generateAdmissionNumber(): void {
        const tmpl = this.templateSettings || this.currentTenant?.idTemplates;
        if (!tmpl) return;
        const parts: string[] = [];
        if (tmpl.admissionPrefix) parts.push(tmpl.admissionPrefix);
        if (tmpl.includeYear) parts.push(new Date().getFullYear().toString());
        const seq = this.nextSequence(tmpl.admissionSeqLength || 4);
        parts.push(seq);
        this.enrollmentForm.get('enrollment.admissionNumber')?.setValue(parts.join('-'));
    }

    generateRollNumber(): void {
        const tmpl = this.templateSettings || this.currentTenant?.idTemplates;
        if (!tmpl) return;
        const enrollmentGroup = this.enrollmentForm.get('enrollment') as FormGroup;
        const cls = enrollmentGroup.get('class')?.value || tmpl.sampleClass || '';
        const section = enrollmentGroup.get('section')?.value || tmpl.sampleSection || '';
        const seq = this.nextSequence(tmpl.rollSeqLength || 2);
        const prefix = tmpl.rollPrefix || '';
        const classSection = `${cls}${section ? section : ''}`.trim();
        const result = [prefix, classSection ? `${classSection}-${seq}` : seq].filter(Boolean).join('');
        enrollmentGroup.get('rollNumber')?.setValue(result);
    }

    initializeForms(): void {
        // Personal Information
        this.personalInfoForm = this.fb.group({
            firstName: [''],
            lastName: [''],
            middleName: [''],
            dateOfBirth: [''],
            gender: [''],
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

    setSchoolId(value: string | null): void {
        this.schoolId.set(value);
    }

    handleSchoolChange(value: string | null): void {
        this.setSchoolId(value);
        this.onDuplicateFieldBlur();
    }

    private ensureEnrollmentDefaults(): void {
        const enrollmentGroup = this.enrollmentForm.get('enrollment') as FormGroup;
        if (!enrollmentGroup.get('admissionDate')?.value) {
            enrollmentGroup.patchValue({ admissionDate: new Date().toISOString().slice(0, 10) });
        }
    }

    private buildAcademicYearOptions(academicYear: Tenant['academicYear']): MbSelectOption[] {
        if (!academicYear) return [];
        const name = academicYear.name
            || this.formatAcademicYearRange(academicYear.start, academicYear.end);
        return name ? [{ label: name, value: name }] : [];
    }

    private formatAcademicYearRange(start?: string | Date, end?: string | Date): string | null {
        if (!start || !end) return null;
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            return null;
        }
        return `${startDate.getFullYear()}-${endDate.getFullYear()}`;
    }

    private setAcademicYearOptions(options: MbSelectOption[]): void {
        this.academicYearOptions = options;
        this.academicYearLoading.set(false);
    }

    private loadGuardianRelationships(): void {
        this.guardianRelationshipsLoading.set(true);
        this.studentService.getGuardianRelationships().subscribe({
            next: (options) => {
                const normalized = options.map((option) => ({
                    label: option.label,
                    value: option.value
                }));
                this.guardianRelationshipOptions.set(normalized);
                this.guardianRelationshipsLoading.set(false);
            },
            error: () => {
                this.guardianRelationshipOptions.set([]);
                this.guardianRelationshipsLoading.set(false);
            }
        });
    }

    applyStudentSchema(schema: Record<string, boolean>): void {
        this.studentSchema.set(schema);
        this.applySchemaValidators();
    }

    applySchemaValidators(): void {
        const required = this.studentSchema();
        if (!required) {
            return;
        }
        this.setRequiredValidator(this.personalInfoForm, 'firstName', required['firstName']);
        this.setRequiredValidator(this.personalInfoForm, 'lastName', required['lastName']);
        this.setRequiredValidator(this.personalInfoForm, 'dateOfBirth', required['dateOfBirth']);
        this.setRequiredValidator(this.personalInfoForm, 'gender', required['gender']);
        this.setRequiredValidator(this.personalInfoForm, 'email', required['email']);
        this.setRequiredValidator(this.personalInfoForm, 'phone', required['phone']);
    }

    private setRequiredValidator(form: FormGroup, controlName: string, isRequired?: boolean): void {
        const control = form.get(controlName);
        if (!control) return;
        const validators = control.validator ? [control.validator] : [];
        if (isRequired) {
            control.setValidators([Validators.required, ...validators]);
        } else {
            control.setValidators(validators);
        }
        control.updateValueAndValidity({ emitEvent: false });
    }

    isRequiredField(key: string): boolean {
        return Boolean(this.studentSchema()?.[key]);
    }

    isFieldInvalid(form: FormGroup, controlName: string): boolean {
        const control = form.get(controlName);
        return !!control && control.invalid && (control.touched || this.submitAttempted());
    }

    fieldError(form: FormGroup, controlName: string, label: string): string {
        const control = form.get(controlName);
        if (!control || !control.errors) return '';
        if (control.errors['required']) {
            return `${label} is required`;
        }
        if (control.errors['email']) {
            return 'Enter a valid email';
        }
        return `${label} is invalid`;
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
        this.schoolId.set(student.schoolId);
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
        this.selectedClassId.set(student.enrollment.class || null);
        this.selectedSectionId.set(student.enrollment.section || null);

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

    applyPlacement(selection: MbClassStatusSelection): void {
        const enrollmentGroup = this.enrollmentForm.get('enrollment') as FormGroup;
        enrollmentGroup.patchValue({
            class: selection.classLabel || '',
            section: selection.sectionLabel || ''
        });
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
        this.syncGuardianValidators();
    }

    removeGuardian(index: number): void {
        if (this.guardians.length > 1) {
            this.guardians.removeAt(index);
        }
        this.syncGuardianValidators();
    }

    copyStudentAddress(index: number): void {
        const address = this.personalInfoForm.get('address')?.value;
        if (!address) return;
        const guardianAddress = this.guardians.at(index).get('address') as FormGroup;
        guardianAddress.patchValue({
            street: address.street || '',
            city: address.city || '',
            state: address.state || '',
            postalCode: address.postalCode || '',
            country: address.country || ''
        });
    }

    setPrimaryGuardian(index: number): void {
        this.guardians.controls.forEach((control, i) => {
            control.get('isPrimary')?.setValue(i === index);
        });
    }

    setGuardianEnabled(value: boolean): void {
        if (!this.canManageGuardians()) {
            this.guardianEnabled.set(false);
            this.syncGuardianValidators();
            return;
        }
        if (this.guardianRequired()) {
            this.guardianEnabled.set(true);
            return;
        }
        this.guardianEnabled.set(value);
        if (!value) {
            this.guardians.clear();
        } else if (!this.guardians.length) {
            this.addGuardian();
        }
        this.syncGuardianValidators();
    }

    private syncGuardianValidators(): void {
        const guardiansArray = this.guardians;
        if (!this.guardianEnabled()) {
            guardiansArray.clearValidators();
            guardiansArray.controls.forEach((control) => {
                control.get('name')?.clearValidators();
                control.get('relationship')?.clearValidators();
                control.get('phone')?.clearValidators();
            });
            guardiansArray.updateValueAndValidity({ emitEvent: false });
            return;
        }
        guardiansArray.setValidators(Validators.required);
        guardiansArray.controls.forEach((control) => {
            control.get('name')?.setValidators(Validators.required);
            control.get('relationship')?.setValidators(Validators.required);
            control.get('phone')?.setValidators(Validators.required);
        });
        guardiansArray.updateValueAndValidity({ emitEvent: false });
    }

    onDuplicateFieldBlur(): void {
        const firstName = this.personalInfoForm.get('firstName')?.value?.trim();
        const lastName = this.personalInfoForm.get('lastName')?.value?.trim();
        const dateOfBirth = this.personalInfoForm.get('dateOfBirth')?.value;
        const academicYear = this.enrollmentForm.get('enrollment.academicYear')?.value;
        const schoolId = this.schoolId() || this.schoolContext.activeSchool()?.id || this.currentTenant?.metadata?.['schoolId'];
        if (!firstName || !lastName || !dateOfBirth || !schoolId) {
            this.clearDuplicates();
            return;
        }
        this.duplicateLoading.set(true);
        this.duplicateError.set(null);
        this.studentService.checkDuplicates({
            firstName,
            lastName,
            dateOfBirth,
            schoolId,
            academicYear
        }).subscribe({
            next: (students) => {
                this.duplicateMatches.set(students.slice(0, 5));
                this.duplicateLoading.set(false);
            },
            error: () => {
                this.duplicateError.set('Could not check duplicates.');
                this.duplicateLoading.set(false);
            }
        });
    }

    clearDuplicates(): void {
        this.duplicateMatches.set([]);
        this.duplicateError.set(null);
        this.duplicateLoading.set(false);
    }

    openDuplicate(student: Student): void {
        this.viewStudent.emit(student.id);
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
                // Address section (part of personal form)
                const addressGroup = this.personalInfoForm.get('address') as FormGroup;
                if (addressGroup && addressGroup.invalid) {
                    this.markFormGroupTouched(addressGroup);
                    return false;
                }
                return true;
            case 3:
                if (this.enrollmentForm.invalid) {
                    this.markFormGroupTouched(this.enrollmentForm);
                    return false;
                }
                return true;
            case 4:
                if (!this.guardianEnabled()) {
                    return true;
                }
                // Check if there are any guardians
                if (this.guardians.length === 0) {
                    this.error.set('Please add at least one guardian');
                    this.markFormGroupTouched(this.guardiansForm);
                    return false;
                }

                // Validate guardian forms
                if (this.guardiansForm.invalid) {
                    this.markFormGroupTouched(this.guardiansForm);
                    this.error.set('Please fill in required guardian fields (Name, Relationship, Phone)');
                    return false;
                }

                // Auto-set primary if only one guardian exists
                if (this.guardians.length === 1) {
                    this.guardians.at(0).get('isPrimary')?.setValue(true);
                } else {
                    // Ensure at least one primary guardian when multiple exist
                    const hasPrimary = this.guardians.controls.some(g => g.get('isPrimary')?.value);
                    if (!hasPrimary) {
                        this.error.set('Please designate one guardian as primary');
                        return false;
                    }
                }
                this.error.set(null);
                return true;
            case 5:
                return true; // Medical info optional
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
        this.submitAttempted.set(true);
        const guardiansInvalid = this.guardianEnabled() && this.guardiansForm.invalid;
        if (this.personalInfoForm.invalid || this.enrollmentForm.invalid || guardiansInvalid) {
            this.error.set('Please fix the highlighted fields.');
            this.markFormGroupTouched(this.personalInfoForm);
            this.markFormGroupTouched(this.enrollmentForm);
            if (this.guardianEnabled()) {
                this.markFormGroupTouched(this.guardiansForm);
            }
            return;
        }

        this.submitting.set(true);
        this.error.set(null);

        // Transform guardians data to match backend expectations
        const transformedGuardians = this.guardianEnabled() ? this.guardians.value.map((g: any) => {
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
                name: guardianData.name?.trim(),
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
        }) : [];

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
            schoolId: this.resolveSchoolId(),
            firstName: personalInfo.firstName,
            lastName: personalInfo.lastName,
            dateOfBirth: personalInfo.dateOfBirth,
            gender: personalInfo.gender,
            enrollment: enrollmentData,
            guardians: transformedGuardians.length ? transformedGuardians : undefined,
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
            next: (savedStudent) => {
                this.submitting.set(false);
                if (this.embedded) {
                    if (saveAndNew) {
                        this.savedAndNew.emit(savedStudent);
                        this.resetForAnotherStudent();
                        return;
                    }
                    this.saved.emit(savedStudent);
                    return;
                }
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

    private resetForAnotherStudent(): void {
        const retainedSchoolId = this.schoolId();
        const retainedYear = this.enrollmentForm.get('enrollment.academicYear')?.value;
        const guardianOn = this.guardianEnabled();
        this.initializeForms();
        this.submitAttempted.set(false);
        this.error.set(null);
        this.saveNotice.set('Student created.');
        this.clearDuplicates();
        this.applySchemaValidators();
        this.syncGuardianValidators();
        this.ensureEnrollmentDefaults();
        if (guardianOn) {
            this.guardians.clear();
            this.addGuardian();
        }
        if (retainedSchoolId) {
            this.schoolId.set(retainedSchoolId);
        }
        if (retainedYear) {
            this.enrollmentForm.patchValue({
                enrollment: { academicYear: retainedYear }
            });
        }
        setTimeout(() => this.saveNotice.set(null), 3000);
    }

    cancel(): void {
        if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
            this.router.navigate(['/students']);
        }
    }

    private resolveSchoolId(): string {
        const fromContext = this.schoolContext.activeSchool()?.id;
        const fromTenant = this.currentTenant?.metadata?.['schoolId'];
        const resolved = this.schoolId() || fromContext || fromTenant;
        if (!resolved) {
            throw new Error('School ID is required to create a student.');
        }
        return resolved;
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
