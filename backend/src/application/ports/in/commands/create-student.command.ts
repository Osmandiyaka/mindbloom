export interface CreateStudentCommand {
    tenantId: string;
    // Personal Information
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    nationality?: string;
    religion?: string;
    caste?: string;
    motherTongue?: string;

    // Contact Information
    email?: string;
    phone?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };

    // Guardians
    guardians: Array<{
        id?: string;
        name: string;
        relationship: 'father' | 'mother' | 'guardian' | 'sibling' | 'grandparent' | 'other';
        phone: string;
        email?: string;
        occupation?: string;
        address?: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        };
        isPrimary: boolean;
        isEmergencyContact: boolean;
    }>;

    // Medical Information
    medicalInfo?: {
        bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
        allergies?: string[];
        medicalConditions?: string[];
        medications?: string[];
        doctorName?: string;
        doctorPhone?: string;
        insuranceProvider?: string;
        insuranceNumber?: string;
    };

    // Enrollment Information
    enrollment: {
        admissionNumber: string;
        admissionDate: Date;
        academicYear: string;
        class: string;
        section?: string;
        rollNumber?: string;
        previousSchool?: string;
        previousClass?: string;
    };

    // Additional Information
    photo?: string;
    notes?: string;
}
