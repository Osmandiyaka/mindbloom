export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
    OTHER = 'other',
}

export enum BloodGroup {
    A_POSITIVE = 'A+',
    A_NEGATIVE = 'A-',
    B_POSITIVE = 'B+',
    B_NEGATIVE = 'B-',
    AB_POSITIVE = 'AB+',
    AB_NEGATIVE = 'AB-',
    O_POSITIVE = 'O+',
    O_NEGATIVE = 'O-',
}

export enum StudentStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    GRADUATED = 'graduated',
    TRANSFERRED = 'transferred',
    WITHDRAWN = 'withdrawn',
    SUSPENDED = 'suspended',
}

export enum RelationshipType {
    FATHER = 'father',
    MOTHER = 'mother',
    GUARDIAN = 'guardian',
    SIBLING = 'sibling',
    GRANDPARENT = 'grandparent',
    OTHER = 'other',
}

export interface Address {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface Guardian {
    id: string;
    name: string;
    relationship: RelationshipType;
    phone: string;
    email?: string;
    occupation?: string;
    address?: Address;
    isPrimary: boolean;
    isEmergencyContact: boolean;
}

export interface MedicalInfo {
    bloodGroup?: BloodGroup;
    allergies?: string[];
    medicalConditions?: string[];
    medications?: string[];
    doctorName?: string;
    doctorPhone?: string;
    insuranceProvider?: string;
    insuranceNumber?: string;
}

export interface Document {
    id: string;
    name: string;
    type: string; // birth_certificate, id_card, photo, etc.
    url: string;
    uploadedAt: Date;
}

export interface EnrollmentInfo {
    admissionNumber: string;
    admissionDate: Date;
    academicYear: string;
    class: string;
    section?: string;
    rollNumber?: string;
    previousSchool?: string;
    previousClass?: string;
}

export interface StudentProps {
    id: string;
    tenantId: string;
    schoolId: string;

    // Personal Information
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date;
    gender: Gender;
    nationality?: string;
    religion?: string;
    caste?: string;

    // Contact Information
    email?: string;
    phone?: string;
    address?: Address;

    // Guardians
    guardians: Guardian[];

    // Medical Information
    medicalInfo?: MedicalInfo;

    // Enrollment Information
    enrollment: EnrollmentInfo;

    // Status
    status: StudentStatus;

    // Documents
    documents?: Document[];

    // Additional Information
    photo?: string;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

export class Student {
    private props: StudentProps;

    constructor(props: StudentProps) {
        this.props = props;
        this.validate();
    }

    private validate(): void {
        if (!this.props.id) {
            throw new Error('Student ID is required');
        }
        if (!this.props.tenantId) {
            throw new Error('Tenant ID is required');
        }
        if (!this.props.schoolId) {
            throw new Error('School ID is required');
        }
        if (!this.props.firstName || !this.props.lastName) {
            throw new Error('First name and last name are required');
        }
        if (!this.props.dateOfBirth) {
            throw new Error('Date of birth is required');
        }
        if (!this.props.enrollment?.admissionNumber) {
            throw new Error('Admission number is required');
        }
        if (!this.props.guardians || this.props.guardians.length === 0) {
            throw new Error('At least one guardian is required');
        }

        // Validate at least one primary guardian
        const hasPrimaryGuardian = this.props.guardians.some(g => g.isPrimary);
        if (!hasPrimaryGuardian) {
            throw new Error('At least one primary guardian is required');
        }
    }

    // Getters
    get id(): string {
        return this.props.id;
    }

    get tenantId(): string {
        return this.props.tenantId;
    }

    get schoolId(): string {
        return this.props.schoolId;
    }

    get firstName(): string {
        return this.props.firstName;
    }

    get lastName(): string {
        return this.props.lastName;
    }

    get middleName(): string | undefined {
        return this.props.middleName;
    }

    get nationality(): string | undefined {
        return this.props.nationality;
    }

    get religion(): string | undefined {
        return this.props.religion;
    }

    get caste(): string | undefined {
        return this.props.caste;
    }

    get fullName(): string {
        const parts = [this.props.firstName];
        if (this.props.middleName) parts.push(this.props.middleName);
        parts.push(this.props.lastName);
        return parts.join(' ');
    }

    get dateOfBirth(): Date {
        return this.props.dateOfBirth;
    }

    get age(): number {
        const today = new Date();
        const birthDate = new Date(this.props.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    get gender(): Gender {
        return this.props.gender;
    }

    get email(): string | undefined {
        return this.props.email;
    }

    get phone(): string | undefined {
        return this.props.phone;
    }

    get address(): Address | undefined {
        return this.props.address;
    }

    get guardians(): Guardian[] {
        return this.props.guardians;
    }

    get primaryGuardian(): Guardian | undefined {
        return this.props.guardians.find(g => g.isPrimary);
    }

    get medicalInfo(): MedicalInfo | undefined {
        return this.props.medicalInfo;
    }

    get enrollment(): EnrollmentInfo {
        return this.props.enrollment;
    }

    get status(): StudentStatus {
        return this.props.status;
    }

    get documents(): Document[] | undefined {
        return this.props.documents;
    }

    get photo(): string | undefined {
        return this.props.photo;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    // Business methods
    updateProfile(updates: Partial<Pick<StudentProps,
        'firstName' | 'lastName' | 'middleName' | 'email' | 'phone' |
        'address' | 'photo' | 'nationality' | 'religion' |
        'caste'>>): void {
        Object.assign(this.props, updates);
        this.props.updatedAt = new Date();
    }

    updateEnrollment(updates: Partial<EnrollmentInfo>): void {
        this.props.enrollment = { ...this.props.enrollment, ...updates };
        this.props.updatedAt = new Date();
    }

    addGuardian(guardian: Guardian): void {
        this.props.guardians.push(guardian);
        this.props.updatedAt = new Date();
    }

    updateGuardian(guardianId: string, updates: Partial<Guardian>): void {
        const index = this.props.guardians.findIndex(g => g.id === guardianId);
        if (index === -1) {
            throw new Error('Guardian not found');
        }
        this.props.guardians[index] = { ...this.props.guardians[index], ...updates };
        this.props.updatedAt = new Date();
    }

    removeGuardian(guardianId: string): void {
        const guardian = this.props.guardians.find(g => g.id === guardianId);
        if (guardian?.isPrimary && this.props.guardians.length === 1) {
            throw new Error('Cannot remove the only primary guardian');
        }
        this.props.guardians = this.props.guardians.filter(g => g.id !== guardianId);
        this.props.updatedAt = new Date();
    }

    updateMedicalInfo(medicalInfo: MedicalInfo): void {
        this.props.medicalInfo = medicalInfo;
        this.props.updatedAt = new Date();
    }

    addDocument(document: Document): void {
        if (!this.props.documents) {
            this.props.documents = [];
        }
        this.props.documents.push(document);
        this.props.updatedAt = new Date();
    }

    removeDocument(documentId: string): void {
        if (this.props.documents) {
            this.props.documents = this.props.documents.filter(d => d.id !== documentId);
            this.props.updatedAt = new Date();
        }
    }

    changeStatus(status: StudentStatus): void {
        this.props.status = status;
        this.props.updatedAt = new Date();
    }

    promoteToNextClass(newClass: string, newSection?: string, newRollNumber?: string): void {
        this.props.enrollment.class = newClass;
        if (newSection) this.props.enrollment.section = newSection;
        if (newRollNumber) this.props.enrollment.rollNumber = newRollNumber;
        this.props.updatedAt = new Date();
    }

    toJSON(): StudentProps {
        return { ...this.props };
    }
}
