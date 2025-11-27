import { BaseDomainEvent, EventMetadata } from './base.event';

// Admission Domain Events
export class AdmissionStatusChangedEvent extends BaseDomainEvent {
    constructor(
        metadata: EventMetadata,
        public readonly payload: {
            admissionId: string;
            previousStatus: string;
            newStatus: string;
            applicantName: string;
            gradeApplying: string;
            email: string;
            phone: string;
            note?: string;
        }
    ) {
        super('admission.status.changed', metadata);
    }
}

export class AdmissionCreatedEvent extends BaseDomainEvent {
    constructor(
        metadata: EventMetadata,
        public readonly payload: {
            admissionId: string;
            applicantName: string;
            gradeApplying: string;
            email: string;
            phone: string;
        }
    ) {
        super('admission.created', metadata);
    }
}

export class AdmissionApprovedEvent extends BaseDomainEvent {
    constructor(
        metadata: EventMetadata,
        public readonly payload: {
            admissionId: string;
            applicantName: string;
            gradeApplying: string;
            email: string;
        }
    ) {
        super('admission.approved', metadata);
    }
}

export class AdmissionRejectedEvent extends BaseDomainEvent {
    constructor(
        metadata: EventMetadata,
        public readonly payload: {
            admissionId: string;
            applicantName: string;
            email: string;
            reason?: string;
        }
    ) {
        super('admission.rejected', metadata);
    }
}
