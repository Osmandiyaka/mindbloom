import { BaseDomainEvent, EventMetadata } from './base.event';

// Student Domain Events
export class StudentEnrolledEvent extends BaseDomainEvent {
    constructor(
        metadata: EventMetadata,
        public readonly payload: {
            studentId: string;
            admissionId: string;
            gradeLevel: string;
            firstName: string;
            lastName: string;
            email?: string;
            guardians?: Array<{
                name: string;
                email?: string;
                phone: string;
                relationship: string;
            }>;
        }
    ) {
        super('student.enrolled', metadata);
    }
}

export class StudentProfileUpdatedEvent extends BaseDomainEvent {
    constructor(
        metadata: EventMetadata,
        public readonly payload: {
            studentId: string;
            changes: Record<string, any>;
        }
    ) {
        super('student.profile.updated', metadata);
    }
}

export class StudentStatusChangedEvent extends BaseDomainEvent {
    constructor(
        metadata: EventMetadata,
        public readonly payload: {
            studentId: string;
            previousStatus: string;
            newStatus: string;
            reason?: string;
        }
    ) {
        super('student.status.changed', metadata);
    }
}
