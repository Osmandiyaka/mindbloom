// Enums
export enum ApplicationStatus {
    INQUIRY = 'inquiry',
    SUBMITTED = 'submitted',
    UNDER_REVIEW = 'under_review',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    WAITLISTED = 'waitlisted',
    ENROLLED = 'enrolled',
    WITHDRAWN = 'withdrawn',
}

export enum ApplicationSource {
    ONLINE = 'online',
    WALK_IN = 'walk_in',
    REFERRAL = 'referral',
    AGENT = 'agent',
}

export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
    OTHER = 'other',
}

export enum RelationshipType {
    FATHER = 'father',
    MOTHER = 'mother',
    GUARDIAN = 'guardian',
    OTHER = 'other',
}

// Interfaces
export interface Address {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface GuardianContact {
    id?: string;
    name: string;
    relationship: RelationshipType;
    phone: string;
    email?: string;
    occupation?: string;
    address?: Address;
    isPrimary: boolean;
}

export interface PreviousSchoolInfo {
    schoolName: string;
    grade?: string;
    yearLeft?: string;
    reasonForLeaving?: string;
}

export interface ApplicationDocument {
    id: string;
    name: string;
    type: string; // birth_certificate, report_card, transfer_certificate, etc.
    url: string;
    uploadedAt: Date;
}

export interface StatusHistoryEntry {
    from: ApplicationStatus;
    to: ApplicationStatus;
    changedAt: Date;
    changedBy: string;
    note?: string;
}

export interface ApplicationScore {
    academicScore?: number;
    interviewScore?: number;
    testScore?: number;
    totalScore?: number;
    scoredAt?: Date;
    scoredBy?: string;
}

// Main Props Interface
export interface AdmissionProps {
    id: string;
    tenantId: string;

    // Application Info
    applicationNumber?: string; // Auto-generated unique number
    source: ApplicationSource;
    status: ApplicationStatus;

    // Personal Information
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date;
    gender: Gender;
    nationality?: string;
    religion?: string;
    bloodGroup?: string;

    // Contact Information
    email: string;
    phone: string;
    address?: Address;

    // Guardians/Parents
    guardians: GuardianContact[];

    // Academic Information
    gradeApplying: string;
    academicYear: string;
    previousSchool?: PreviousSchoolInfo;

    // Application Materials
    documents?: ApplicationDocument[];
    personalStatement?: string;
    
    // Scoring & Evaluation
    score?: ApplicationScore;

    // Status Management
    statusHistory: StatusHistoryEntry[];
    statusUpdatedAt: Date;

    // Offer Management
    offerSentAt?: Date;
    offerExpiresAt?: Date;
    offerAcceptedAt?: Date;

    // Waitlist
    waitlistPosition?: number;
    waitlistExpiresAt?: Date;

    // Additional
    notes?: string;
    internalNotes?: string; // Staff-only notes
    applicationFeeAmount?: number;
    applicationFeePaid?: boolean;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    submittedAt?: Date;
}

// Domain Entity
export class Admission {
    private props: AdmissionProps;

    constructor(props: AdmissionProps) {
        this.props = props;
        this.validate();
    }

    private validate(): void {
        if (!this.props.id) {
            throw new Error('Admission ID is required');
        }
        if (!this.props.tenantId) {
            throw new Error('Tenant ID is required');
        }
        if (!this.props.firstName || !this.props.lastName) {
            throw new Error('First name and last name are required');
        }
        if (!this.props.email) {
            throw new Error('Email is required');
        }
        if (!this.props.dateOfBirth) {
            throw new Error('Date of birth is required');
        }
        if (!this.props.gradeApplying) {
            throw new Error('Grade applying for is required');
        }
        if (!this.props.guardians || this.props.guardians.length === 0) {
            throw new Error('At least one guardian contact is required');
        }
    }

    // Business Logic Methods

    getFullName(): string {
        const parts = [this.props.firstName, this.props.middleName, this.props.lastName].filter(Boolean);
        return parts.join(' ');
    }

    canTransitionTo(newStatus: ApplicationStatus): boolean {
        const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
            [ApplicationStatus.INQUIRY]: [ApplicationStatus.SUBMITTED, ApplicationStatus.WITHDRAWN],
            [ApplicationStatus.SUBMITTED]: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.WITHDRAWN],
            [ApplicationStatus.UNDER_REVIEW]: [
                ApplicationStatus.ACCEPTED,
                ApplicationStatus.REJECTED,
                ApplicationStatus.WAITLISTED,
                ApplicationStatus.WITHDRAWN,
            ],
            [ApplicationStatus.ACCEPTED]: [ApplicationStatus.ENROLLED, ApplicationStatus.WITHDRAWN],
            [ApplicationStatus.REJECTED]: [ApplicationStatus.UNDER_REVIEW], // Can reopen
            [ApplicationStatus.WAITLISTED]: [
                ApplicationStatus.ACCEPTED,
                ApplicationStatus.REJECTED,
                ApplicationStatus.WITHDRAWN,
            ],
            [ApplicationStatus.ENROLLED]: [], // Terminal state
            [ApplicationStatus.WITHDRAWN]: [], // Terminal state
        };

        return validTransitions[this.props.status]?.includes(newStatus) || false;
    }

    isTerminalStatus(): boolean {
        return [ApplicationStatus.ENROLLED, ApplicationStatus.WITHDRAWN].includes(this.props.status);
    }

    isPendingReview(): boolean {
        return [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW].includes(this.props.status);
    }

    isAccepted(): boolean {
        return this.props.status === ApplicationStatus.ACCEPTED;
    }

    isEnrolled(): boolean {
        return this.props.status === ApplicationStatus.ENROLLED;
    }

    hasOfferExpired(): boolean {
        if (!this.props.offerExpiresAt) return false;
        return new Date() > this.props.offerExpiresAt;
    }

    canBeEnrolled(): boolean {
        return this.props.status === ApplicationStatus.ACCEPTED && !this.hasOfferExpired();
    }

    getPrimaryGuardian(): GuardianContact | undefined {
        return this.props.guardians.find(g => g.isPrimary);
    }

    calculateAge(): number {
        const today = new Date();
        const birthDate = new Date(this.props.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    hasRequiredDocuments(): boolean {
        // At minimum need birth certificate
        return this.props.documents?.some(doc => doc.type === 'birth_certificate') || false;
    }

    getDaysSinceSubmission(): number | null {
        if (!this.props.submittedAt) return null;
        const diff = Date.now() - this.props.submittedAt.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    // Getters (controlled access to properties)
    get id(): string { return this.props.id; }
    get tenantId(): string { return this.props.tenantId; }
    get applicationNumber(): string | undefined { return this.props.applicationNumber; }
    get source(): ApplicationSource { return this.props.source; }
    get status(): ApplicationStatus { return this.props.status; }
    get firstName(): string { return this.props.firstName; }
    get lastName(): string { return this.props.lastName; }
    get middleName(): string | undefined { return this.props.middleName; }
    get dateOfBirth(): Date { return this.props.dateOfBirth; }
    get gender(): Gender { return this.props.gender; }
    get nationality(): string | undefined { return this.props.nationality; }
    get religion(): string | undefined { return this.props.religion; }
    get bloodGroup(): string | undefined { return this.props.bloodGroup; }
    get email(): string { return this.props.email; }
    get phone(): string { return this.props.phone; }
    get address(): Address | undefined { return this.props.address; }
    get guardians(): GuardianContact[] { return this.props.guardians; }
    get gradeApplying(): string { return this.props.gradeApplying; }
    get academicYear(): string { return this.props.academicYear; }
    get previousSchool(): PreviousSchoolInfo | undefined { return this.props.previousSchool; }
    get documents(): ApplicationDocument[] | undefined { return this.props.documents; }
    get personalStatement(): string | undefined { return this.props.personalStatement; }
    get score(): ApplicationScore | undefined { return this.props.score; }
    get statusHistory(): StatusHistoryEntry[] { return this.props.statusHistory; }
    get statusUpdatedAt(): Date { return this.props.statusUpdatedAt; }
    get offerSentAt(): Date | undefined { return this.props.offerSentAt; }
    get offerExpiresAt(): Date | undefined { return this.props.offerExpiresAt; }
    get offerAcceptedAt(): Date | undefined { return this.props.offerAcceptedAt; }
    get waitlistPosition(): number | undefined { return this.props.waitlistPosition; }
    get waitlistExpiresAt(): Date | undefined { return this.props.waitlistExpiresAt; }
    get notes(): string | undefined { return this.props.notes; }
    get internalNotes(): string | undefined { return this.props.internalNotes; }
    get applicationFeeAmount(): number | undefined { return this.props.applicationFeeAmount; }
    get applicationFeePaid(): boolean | undefined { return this.props.applicationFeePaid; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }
    get submittedAt(): Date | undefined { return this.props.submittedAt; }

    // For updates - returns new instance (immutable approach)
    updateStatus(newStatus: ApplicationStatus, changedBy: string, note?: string): Admission {
        if (!this.canTransitionTo(newStatus)) {
            throw new Error(`Cannot transition from ${this.props.status} to ${newStatus}`);
        }

        const now = new Date();
        const historyEntry: StatusHistoryEntry = {
            from: this.props.status,
            to: newStatus,
            changedAt: now,
            changedBy,
            note,
        };

        return new Admission({
            ...this.props,
            status: newStatus,
            statusUpdatedAt: now,
            statusHistory: [...this.props.statusHistory, historyEntry],
            updatedAt: now,
        });
    }

    // Static factory method
    static create(props: Omit<AdmissionProps, 'id' | 'statusHistory' | 'statusUpdatedAt' | 'createdAt' | 'updatedAt'>): Admission {
        const now = new Date();
        const initialHistoryEntry: StatusHistoryEntry = {
            from: props.status,
            to: props.status,
            changedAt: now,
            changedBy: 'system',
            note: 'Application created',
        };

        return new Admission({
            ...props,
            id: '', // Will be set by repository
            statusHistory: [initialHistoryEntry],
            statusUpdatedAt: now,
            createdAt: now,
            updatedAt: now,
        });
    }
}
