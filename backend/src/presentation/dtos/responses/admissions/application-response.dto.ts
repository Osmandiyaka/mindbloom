import { Admission } from '../../../../domain/admission/entities/admission.entity';

export class ApplicationResponseDto {
    id: string;
    tenantId: string;
    applicationNumber?: string;
    source: string;
    status: string;

    // Personal
    firstName: string;
    lastName: string;
    middleName?: string;
    fullName: string;
    dateOfBirth: Date;
    age: number;
    gender: string;
    nationality?: string;
    religion?: string;
    bloodGroup?: string;

    // Contact
    email: string;
    phone: string;
    address?: any;

    // Guardians
    guardians: any[];
    primaryGuardian?: any;

    // Academic
    gradeApplying: string;
    academicYear: string;
    previousSchool?: any;

    // Documents
    documents?: any[];
    hasRequiredDocuments: boolean;
    personalStatement?: string;

    // Scoring
    score?: any;

    // Status
    statusHistory: any[];
    statusUpdatedAt: Date;
    daysSinceSubmission: number | null;

    // Offer
    offerSentAt?: Date;
    offerExpiresAt?: Date;
    offerAcceptedAt?: Date;
    hasOfferExpired?: boolean;
    canBeEnrolled: boolean;

    // Waitlist
    waitlistPosition?: number;
    waitlistExpiresAt?: Date;

    // Additional
    notes?: string;
    internalNotes?: string;
    applicationFeeAmount?: number;
    applicationFeePaid?: boolean;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    submittedAt?: Date;

    static fromDomain(admission: Admission): ApplicationResponseDto {
        return {
            id: admission.id,
            tenantId: admission.tenantId,
            applicationNumber: admission.applicationNumber,
            source: admission.source,
            status: admission.status,
            firstName: admission.firstName,
            lastName: admission.lastName,
            middleName: admission.middleName,
            fullName: admission.getFullName(),
            dateOfBirth: admission.dateOfBirth,
            age: admission.calculateAge(),
            gender: admission.gender,
            nationality: admission.nationality,
            religion: admission.religion,
            bloodGroup: admission.bloodGroup,
            email: admission.email,
            phone: admission.phone,
            address: admission.address,
            guardians: admission.guardians,
            primaryGuardian: admission.getPrimaryGuardian(),
            gradeApplying: admission.gradeApplying,
            academicYear: admission.academicYear,
            previousSchool: admission.previousSchool,
            documents: admission.documents,
            hasRequiredDocuments: admission.hasRequiredDocuments(),
            personalStatement: admission.personalStatement,
            score: admission.score,
            statusHistory: admission.statusHistory,
            statusUpdatedAt: admission.statusUpdatedAt,
            daysSinceSubmission: admission.getDaysSinceSubmission(),
            offerSentAt: admission.offerSentAt,
            offerExpiresAt: admission.offerExpiresAt,
            offerAcceptedAt: admission.offerAcceptedAt,
            hasOfferExpired: admission.hasOfferExpired(),
            canBeEnrolled: admission.canBeEnrolled(),
            waitlistPosition: admission.waitlistPosition,
            waitlistExpiresAt: admission.waitlistExpiresAt,
            notes: admission.notes,
            internalNotes: admission.internalNotes,
            applicationFeeAmount: admission.applicationFeeAmount,
            applicationFeePaid: admission.applicationFeePaid,
            createdAt: admission.createdAt,
            updatedAt: admission.updatedAt,
            submittedAt: admission.submittedAt,
        };
    }

    static fromDomainArray(admissions: Admission[]): ApplicationResponseDto[] {
        return admissions.map(admission => ApplicationResponseDto.fromDomain(admission));
    }
}
