// Base Event Class for all domain events
export abstract class DomainEvent {
    public readonly occurredAt: Date;
    public readonly eventId: string;
    public readonly eventType: string;

    constructor(eventType: string) {
        this.occurredAt = new Date();
        this.eventId = `${eventType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.eventType = eventType;
    }
}

// Event payload interfaces
export interface EventMetadata {
    tenantId: string;
    userId?: string;
    correlationId?: string;
}

export abstract class BaseDomainEvent extends DomainEvent {
    constructor(
        eventType: string,
        public readonly metadata: EventMetadata
    ) {
        super(eventType);
    }
}
