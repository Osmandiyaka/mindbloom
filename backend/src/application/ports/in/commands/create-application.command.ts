export interface CreateApplicationCommand {
    tenantId: string;
    
    // Source
    source: string; // 'online', 'walk_in', etc.
    
    // Personal Information
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date;
    gender: string;
    nationality?: string;
    religion?: string;
    bloodGroup?: string;
    
    // Contact
    email: string;
    phone: string;
    address?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    
    // Guardians
    guardians: Array<{
        name: string;
        relationship: string;
        phone: string;
        email?: string;
        occupation?: string;
        address?: any;
        isPrimary: boolean;
    }>;
    
    // Academic
    gradeApplying: string;
    academicYear: string;
    previousSchool?: {
        schoolName: string;
        grade?: string;
        yearLeft?: string;
        reasonForLeaving?: string;
    };
    
    // Additional
    personalStatement?: string;
    notes?: string;
    applicationFeeAmount?: number;
    applicationFeePaid?: boolean;
}
