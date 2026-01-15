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
    type: string;
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

export interface Student {
    id: string;

    // Personal Information
    firstName: string;
    lastName: string;
    fullName: string;
    middleName?: string;
    dateOfBirth: Date;
    age: number;
    gender: Gender;
    nationality?: string;
    religion?: string;
    caste?: string;
    motherTongue?: string;

    // Contact Information
    email?: string;
    phone?: string;
    address?: Address;

    // Guardians
    guardians: Guardian[];
    primaryGuardian?: Guardian;

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
    notes?: string;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

export interface StudentFilters {
    search?: string;
    class?: string;
    section?: string;
    status?: string;
    academicYear?: string;
    gender?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
}

export interface CreateStudentDto {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date | string;
    gender: Gender;
    nationality?: string;
    religion?: string;
    caste?: string;
    motherTongue?: string;
    email?: string;
    phone?: string;
    address?: Address;
    guardians: Omit<Guardian, 'id'>[];
    medicalInfo?: MedicalInfo;
    enrollment: EnrollmentInfo;
    photo?: string;
    notes?: string;
}

export interface UpdateStudentDto {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string | Date;
    address?: Address;
    nationality?: string;
    religion?: string;
    caste?: string;
    motherTongue?: string;
    status?: StudentStatus;
    photo?: string;
    notes?: string;
}
